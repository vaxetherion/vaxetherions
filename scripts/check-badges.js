// scripts/check-badges.js
// Periksa badge workflow di README banyak repo sekaligus:
//   1) ambil nama repo AKTUAL (owner/repo) dari API GitHub,
//   2) unduh README.md repo tersebut,
//   3) ekstrak seluruh URL badge workflow (.../actions/workflows/<nama>.yml/badge.svg),
//   4) pastikan slug "owner/repo" di URL badge == nama repo aktual
//      (mencegah badge 404 karena nama repo salah, seperti
//      vaxetherion/vaxetherion vs vaxetherions),
//   5) pastikan badge benar-benar dimuat (HTTP 200 + Content-Type gambar),
//   6) badge pihak ketiga (shields.io, Codecov, badgen.net) dicek dapat
//      dimuat; bila URL-nya memuat slug owner/repo (mis. Codecov
//      /gh/<owner>/<repo>) slug tersebut ikut dicocokkan dengan repo aktual.
//
// Penggunaan:
//   node scripts/check-badges.js                     → repo saat ini (dari remote git)
//   node scripts/check-badges.js owner/a owner/b ... → banyak repo sekaligus
//   BADGE_CHECK_REPOS="owner/a,owner/b" node scripts/check-badges.js
//   GITHUB_TOKEN=ghp_...                             → opsional, hindari rate limit API
//
// Exit code: 0 = semua aman; 1 = ada masalah; 2 = tidak ada repo untuk diperiksa.
// Fungsi murni diekspor agar bisa diuji (tests/check-badges.spec.js).

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REQUEST_TIMEOUT_MS = 20_000;
const BADGE_PATTERN =
  /https:\/\/github\.com\/([^/]+\/[^/]+)\/actions\/workflows\/([^"')\s]+)\/badge\.svg[^"')\s]*/gi;

// Penyedia badge pihak ketiga yang dikenal — dicek dapat dimuat.
const THIRD_PARTY_PROVIDERS = ['img.shields.io', 'shields.io', 'codecov.io', 'badgen.net'];

const API_HEADERS = {
  'User-Agent': 'vaxetherion-badge-check',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

// --- Fungsi murni (diekspor untuk unit test) --------------------------------

// Ekstrak seluruh URL badge workflow dari teks README.
// Mengembalikan [{ url, slug, workflow }] — slug adalah bagian "owner/repo"
// yang tertulis di URL, workflow adalah nama file YAML workflow.
export function extractBadgeUrls(readmeText) {
  const badges = [];
  for (const match of readmeText.matchAll(BADGE_PATTERN)) {
    if (!badges.some((b) => b.url === match[0])) {
      badges.push({ url: match[0], slug: match[1], workflow: match[2] });
    }
  }
  return badges;
}

// Ekstrak slug "owner/repo" dari URL badge pihak ketiga bila bentuknya
// deterministik: Codecov /gh/<owner>/<repo>/... (shields.io & lainnya
// bentuknya beragam → null; badge tersebut hanya dicek dapat dimuat).
export function extractRepoSlugFromUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    const segments = pathname.split('/').filter(Boolean);
    if (hostname === 'codecov.io') {
      const idx = segments.indexOf('gh');
      if (idx !== -1 && segments[idx + 2]) return `${segments[idx + 1]}/${segments[idx + 2]}`;
    }
  } catch {
    // URL tidak valid — biarkan null.
  }
  return null;
}

// Ekstrak URL badge pihak ketiga dari teks README (tag <img src> maupun
// markdown ![alt](url)), khusus dari penyedia di THIRD_PARTY_PROVIDERS.
export function extractThirdPartyBadgeUrls(readmeText) {
  const urls = [];
  const add = (raw) => {
    if (!/^https?:\/\//i.test(raw)) return;
    let hostname;
    try {
      hostname = new URL(raw).hostname;
    } catch {
      return;
    }
    if (THIRD_PARTY_PROVIDERS.includes(hostname) && !urls.includes(raw)) {
      urls.push(raw);
    }
  };
  for (const match of readmeText.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) add(match[1]);
  for (const match of readmeText.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/gi)) add(match[1]);
  // Gaya reference-style markdown: `[label]: https://...` (umum di README)
  for (const match of readmeText.matchAll(/^\[[^\]]+\]:\s*(https?:\/\/\S+)/gm)) add(match[1]);
  return urls;
}

// Perbandingan slug owner/repo (nama repo GitHub tidak peka huruf besar/kecil).
export function slugsMatch(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

// Slug "owner/repo" dari remote git origin saat ini (format https, https+token,
// dan ssh git@github.com:...). Null bila tidak bisa ditentukan.
export function getCurrentRepoSlug() {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // Tidak ada remote origin.
  }
  return null;
}

// Tentukan daftar repo yang diperiksa: argumen CLI → env BADGE_CHECK_REPOS →
// repo saat ini. Null bila tidak ada sumber sama sekali.
export function resolveRepos(args, envValue, currentSlug) {
  const fromArgs = args.filter((a) => a && !a.startsWith('-'));
  if (fromArgs.length > 0) return fromArgs;
  const fromEnv = (envValue ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return currentSlug ? [currentSlug] : null;
}

// --- Bagian jaringan (tidak diekspor) ----------------------------------------

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { headers: API_HEADERS, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

// Nama repo aktual dari API GitHub (sumber kebenaran; mengikuti rename/move).
// Error jaringan tidak boleh menggagalkan seluruh run — dilaporkan per-repo.
async function getActualRepoSlug(repo) {
  try {
    const response = await fetchWithTimeout(`https://api.github.com/repos/${repo}`);
    if (response.status === 404) return { ok: false, reason: 'repo tidak ditemukan di GitHub (404)' };
    if (response.status === 403) return { ok: false, reason: 'rate limit API tercapai (403) — set GITHUB_TOKEN' };
    if (!response.ok) return { ok: false, reason: `API GitHub HTTP ${response.status}` };
    const data = await response.json();
    return { ok: true, slug: data.full_name };
  } catch (error) {
    return { ok: false, reason: `gagal terhubung ke API GitHub: ${error.message}` };
  }
}

// Nama file README umum — path raw.githubusercontent bersifat case-sensitive,
// jadi dicoba beberapa varian sebelum menyerah.
const README_CANDIDATES = ['README.md', 'Readme.md', 'readme.md', 'README.rst', 'README.txt'];

async function getReadme(repo) {
  try {
    for (const candidate of README_CANDIDATES) {
      const response = await fetchWithTimeout(`https://raw.githubusercontent.com/${repo}/HEAD/${candidate}`);
      if (response.ok) return { ok: true, text: await response.text() };
    }
    return {
      ok: false,
      reason: `README tidak ditemukan (dicoba: ${README_CANDIDATES.join(', ')})`,
    };
  } catch (error) {
    return { ok: false, reason: `gagal mengunduh README: ${error.message}` };
  }
}

// Pastikan badge benar-benar dimuat: HTTP 200 + Content-Type gambar + body tidak kosong.
async function checkBadgeLoads(url) {
  try {
    const response = await fetchWithTimeout(url);
    const contentType = response.headers.get('content-type') ?? '';
    const body = await response.text();
    const ok = response.status === 200 && contentType.includes('image') && body.length > 0;
    return { ok, detail: ok ? '' : `HTTP ${response.status} (${contentType})` };
  } catch (error) {
    return { ok: false, detail: `gagal dimuat: ${error.message}` };
  }
}

// --- Alur utama ---------------------------------------------------------------

const USAGE = `Penggunaan:
  node scripts/check-badges.js                     → repo saat ini (dari remote git)
  node scripts/check-badges.js owner/a owner/b ... → banyak repo sekaligus
  BADGE_CHECK_REPOS="owner/a,owner/b" node scripts/check-badges.js
Env opsional: GITHUB_TOKEN (hindari rate limit API GitHub).`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  const repos = resolveRepos(args, process.env.BADGE_CHECK_REPOS ?? '', getCurrentRepoSlug());
  if (!repos) {
    console.error('❌ Tidak ada repo untuk diperiksa.');
    console.error(USAGE);
    process.exit(2);
  }

  console.log(`🔎 Memeriksa badge workflow di README ${repos.length} repo...\n`);
  let failures = 0;

  for (const repo of repos) {
    console.log(`📦 ${repo}`);

    const actual = await getActualRepoSlug(repo);
    if (!actual.ok) {
      console.log(`   ✘ ${actual.reason}`);
      failures++;
      continue;
    }
    console.log(`   ✔ Nama repo aktual : ${actual.slug}`);

    const readme = await getReadme(actual.slug);
    if (!readme.ok) {
      console.log(`   ✘ ${readme.reason}`);
      failures++;
      continue;
    }

    const badges = extractBadgeUrls(readme.text);
    console.log(`   🔗 ${badges.length} badge workflow ditemukan`);
    for (const badge of badges) {
      const nameOk = slugsMatch(badge.slug, actual.slug);
      const load = await checkBadgeLoads(badge.url);
      const problems = [];
      if (!nameOk) problems.push(`badge menunjuk "${badge.slug}" ≠ aktual "${actual.slug}"`);
      if (!load.ok) problems.push(load.detail);
      if (problems.length > 0) failures++;
      console.log(
        `   ${problems.length === 0 ? '✔' : '✘'} ${badge.workflow}${problems.length > 0 ? ` — ${problems.join('; ')}` : ''}`,
      );
    }

    const thirdParty = extractThirdPartyBadgeUrls(readme.text);
    if (thirdParty.length > 0) {
      console.log(`   🏷 ${thirdParty.length} badge pihak ketiga ditemukan`);
      for (const url of thirdParty) {
        const slug = extractRepoSlugFromUrl(url);
        const load = await checkBadgeLoads(url);
        const problems = [];
        if (slug && !slugsMatch(slug, actual.slug)) {
          problems.push(`badge menunjuk "${slug}" ≠ aktual "${actual.slug}"`);
        }
        if (!load.ok) problems.push(load.detail);
        if (problems.length > 0) failures++;
        let label = url.replace(/^https?:\/\//, '').replace(/[?#].*$/, '');
        if (label.length > 70) label = `${label.slice(0, 67)}...`;
        console.log(
          `   ${problems.length === 0 ? '✔' : '✘'} ${label}${problems.length > 0 ? ` — ${problems.join('; ')}` : ''}`,
        );
      }
    }
    console.log('');
  }

  if (failures > 0) {
    console.error('🚨 Masalah ditemukan. Perbaiki URL badge di README agar memakai nama repo aktual / endpoint yang benar.');
    process.exit(1);
  }
  console.log('✅ Semua badge konsisten dengan remote aktual dan berhasil dimuat.');
}

// Jalankan hanya saat dieksekusi langsung (bukan diimpor). Guard argv[1]
// menangani konteks seperti `node -e` yang tidak memiliki argv[1].
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
