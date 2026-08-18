// tests/readme.spec.js
// Suite E2E profil GitHub Aetherion:
//   1. Integritas README.md — seluruh aset GitSkins terpasang sebagai <img>,
//      dan nama repo pada badge workflow cocok dengan remote git aktual.
//   2. Fallback lokal — setiap aset tersedia & bebas vektor script di ./assets/.
//   3. Semua gambar eksternal di README (aset GitSkins + badge workflow GitHub)
//      dimuat: HTTP 200 dengan Content-Type gambar dalam batas waktu longgar.
//      Gambar pihak ketiga bisa flaky sesaat; tiap URL dicoba ulang hingga 3×
//      (jeda 1 dtk) sebelum dinyatakan gagal, dan riwayat semua percobaan ikut
//      dilaporkan agar penyebab jelas.
// Catatan: jalankan `npm run assets` terlebih dahulu (atau `npm test`).

import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GITSKINS_MANIFEST } from '../scripts/gitskins.manifest.js';
import { BADGE_LABELS } from '../scripts/badges.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', 'README.md');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const README = readFileSync(README_PATH, 'utf8');

/* ------------------------------------------------------------------ */
/* Helper bersama                                                      */
/* ------------------------------------------------------------------ */

// Kumpulkan seluruh URL gambar eksternal (http/https) dari tag <img> di
// README — mencakup aset GitSkins dan badge workflow GitHub sekaligus.
// GITSKINS_MANIFEST tetap sumber kebenaran untuk URL aset, tetapi daftar ini
// memastikan tidak ada gambar eksternal lain yang luput dari validasi.
function collectExternalImageUrls() {
  const urls = [];
  for (const match of README.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
    const url = match[1];
    if (/^https?:\/\//i.test(url) && !urls.includes(url)) {
      urls.push(url);
    }
  }
  return urls;
}

// Label ringkas untuk laporan tes: nama aset bila URL berasal dari manifest,
// nama file untuk badge workflow, fallback URL mentah.
function labelForUrl(url) {
  const asset = GITSKINS_MANIFEST.find((entry) => entry.url === url);
  if (asset) return asset.name;
  const badge = url.match(/([^/]+\.yml)\/badge\.svg$/);
  if (badge) return `badge: ${badge[1]}`;
  return url;
}

// Slug "owner/repo" dari remote git aktual. Prioritas:
//   1) GITHUB_REPOSITORY (env bawaan GitHub Actions — paling andal di CI),
//   2) parsing `git remote get-url origin` (menangani format https,
//      https+token, dan ssh git@github.com:...).
// Mengembalikan null bila tidak bisa ditentukan (mis. tanpa remote origin).
function getActualRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // Tidak ada remote origin — biarkan null, tes terkait akan di-skip.
  }
  return null;
}

const ACTUAL_REPO_SLUG = getActualRepoSlug();
const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');

/* ------------------------------------------------------------------ */
/* 0. Konsistensi jumlah badge workflow vs jumlah file workflow         */
/* ------------------------------------------------------------------ */
test.describe('Jumlah badge workflow sesuai jumlah file workflow', () => {
  // Pastikan setiap badge workflow di header README sesuai dengan file
  // .yml yang ada di .github/workflows/. Mencegah badge yang menunjuk
  // workflow yang sudah dihapus atau workflow yang belum ditambah badge-nya.
  const badgeCount = [
    ...README.matchAll(
      /src="https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/workflows\/[^"']+\/badge\.svg"/gi,
    ),
  ].length;
  const workflowCount = existsSync(WORKFLOWS_DIR)
    ? readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.yml')).length
    : 0;

  test('Jumlah badge workflow di header == jumlah file .yml di .github/workflows/', () => {
    expect(
      badgeCount,
      `README memiliki ${badgeCount} badge workflow, tetapi .github/workflows/ memiliki ${workflowCount} file YAML. ` +
        `Jalankan \`npm run badges:gen\` untuk sinkronisasi.`,
    ).toBe(workflowCount);
  });

  // Setiap entry di BADGE_LABELS harus ada badge-nya di README
  for (const { file } of BADGE_LABELS) {
    test(`Badge workflow "${file}" ada di README`, () => {
      expect(README, `Badge untuk ${file} tidak ditemukan di README.md`).toContain(
        `/workflows/${file}/badge.svg`,
      );
    });
  }
});

/* ------------------------------------------------------------------ */
/* 1. Integritas README.md                                             */
/* ------------------------------------------------------------------ */
test.describe('Integritas README.md', () => {
  // Seluruh URL GitSkins harus muncul di README (tidak boleh ada yang hilang)
  for (const asset of GITSKINS_MANIFEST) {
    test(`README memuat aset "${asset.name}"`, () => {
      expect(README, `URL ${asset.url} tidak ditemukan di README.md`).toContain(asset.url);
    });
  }

  // Setiap tag <img> wajib memiliki atribut alt (aksesibilitas + SEO)
  test('Setiap <img> di README memiliki atribut alt', () => {
    const imgTags = [...README.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    expect(imgTags.length).toBeGreaterThanOrEqual(GITSKINS_MANIFEST.length);
    for (const tag of imgTags) {
      expect(tag, `Tag <img> tanpa alt: ${tag}`).toMatch(/\salt=/i);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 1b. Konsistensi nama repo pada badge workflow                        */
/* ------------------------------------------------------------------ */
test.describe('Konsistensi nama repo pada badge workflow', () => {
  // Slug "owner/repo" yang dipakai URL badge di README (bagian
  // "vaxetherion/vaxetherions" dari https://github.com/OWNER/REPO/actions/...)
  // harus selalu cocok dengan remote git aktual. Ini mencegah regresi seperti
  // badge yang menunjuk repo salah (HTTP 404 / gambar rusak di profil).
  const badgeRefs = [
    ...README.matchAll(
      /src="(https:\/\/github\.com\/([^/]+\/[^/]+)\/actions\/workflows\/([^"]*\/badge\.svg))"/gi,
    ),
  ].map((match) => ({ url: match[1], repo: match[2], workflow: match[3] }));

  test('README memuat setidaknya satu badge workflow', () => {
    expect(badgeRefs.length).toBeGreaterThan(0);
  });

  for (const badge of badgeRefs) {
    test(`Nama repo badge workflow "${badge.workflow}" cocok dengan remote aktual`, () => {
      test.skip(
        !ACTUAL_REPO_SLUG,
        'Remote origin / GITHUB_REPOSITORY tidak tersedia — lewati pemeriksaan.',
      );
      expect(
        badge.repo,
        `Badge ${badge.url} menunjuk ke "${badge.repo}", tetapi remote aktual repo ini adalah "${ACTUAL_REPO_SLUG}".`,
      ).toBe(ACTUAL_REPO_SLUG);
    });
  }
});

/* ------------------------------------------------------------------ */
/* 2. Fallback aset lokal (anti-kadaluarsa)                            */
/* ------------------------------------------------------------------ */
test.describe('Fallback aset lokal ./assets/', () => {
  // Setiap aset manifest harus tersedia sebagai file SVG lokal
  for (const asset of GITSKINS_MANIFEST) {
    test(`Fallback lokal tersedia: assets/${asset.name}.svg`, () => {
      expect(
        existsSync(path.join(ASSETS_DIR, `${asset.name}.svg`)),
        `Jalankan "npm run assets" terlebih dahulu untuk mengunduh ${asset.name}.svg`,
      ).toBe(true);
    });
  }

  // Sanitasi: fallback lokal bebas dari vektor script / event handler
  test('Fallback lokal bebas dari vektor script & event handler', () => {
    for (const asset of GITSKINS_MANIFEST) {
      const content = readFileSync(path.join(ASSETS_DIR, `${asset.name}.svg`), 'utf8');
      expect(content, `${asset.name}: mengandung <script`).not.toMatch(/<script/i);
      expect(content, `${asset.name}: mengandung atribut on*=`).not.toMatch(/\son\w+\s*=/i);
      expect(content, `${asset.name}: mengandung javascript:`).not.toMatch(/javascript:/i);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 3. Semua gambar eksternal di README dimuat (badge + aset GitSkins)  */
/* ------------------------------------------------------------------ */
test.describe('Semua gambar eksternal di README dimuat', () => {
  const ATTEMPTS = 3;
  const RETRY_DELAY_MS = 1_000;
  const REQUEST_TIMEOUT_MS = 20_000;
  const SLOW_MS = 20_000;

  // Daftar tunggal seluruh gambar eksternal README — aset GitSkins dari
  // manifest + badge workflow GitHub — divalidasi dalam satu alur yang sama.
  const EXTERNAL_URLS = collectExternalImageUrls();

  // Jaring pengaman: manifest tetap sumber kebenaran URL aset, jadi pastikan
  // tidak ada aset yang terlewat dari daftar gabungan ini.
  test('Daftar gambar eksternal mencakup seluruh aset GitSkins & badge workflow', () => {
    for (const asset of GITSKINS_MANIFEST) {
      expect(EXTERNAL_URLS, `URL aset ${asset.name} tidak ada di README.md`).toContain(asset.url);
    }
    const badgeCount = EXTERNAL_URLS.filter((url) => url.includes('/badge.svg')).length;
    expect(badgeCount, 'Tidak ada badge workflow di README.md').toBeGreaterThan(0);
  });

  // Minta URL gambar dengan retry terbatas. Mengembalikan riwayat semua
  // percobaan; entry terakhir (history[history.length-1]) adalah hasil final.
  // `entry.ok` true hanya bila: HTTP 200 + Content-Type gambar + body tidak
  // kosong + durasi < SLOW_MS.
  async function requestImageWithRetry(url, label, request) {
    const history = [];
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const start = Date.now();
      let entry;
      try {
        const response = await request.get(url, { timeout: REQUEST_TIMEOUT_MS });
        const body = await response.body().catch(() => Buffer.alloc(0));
        entry = {
          attempt,
          status: response.status(),
          contentType: response.headers()['content-type'] ?? '',
          durationMs: Date.now() - start,
          bodyLength: body.length,
        };
      } catch (error) {
        entry = { attempt, error: error.message, durationMs: Date.now() - start };
      }
      entry.ok =
        entry.status === 200 &&
        (entry.contentType ?? '').includes('image') &&
        entry.bodyLength > 0 &&
        entry.durationMs < SLOW_MS;
      history.push(entry);

      if (entry.ok) break;
      if (attempt < ATTEMPTS) {
        console.log(
          `  ↻ ${label}: percobaan ${attempt} gagal (${entry.status ? `HTTP ${entry.status}` : entry.error}) — retry dalam ${RETRY_DELAY_MS} ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    return history;
  }

  for (const url of EXTERNAL_URLS) {
    test(`HTTP 200 + Content-Type gambar: ${labelForUrl(url)}`, async ({ request }) => {
      // Ruang untuk 3 percobaan × 20 dtk + jeda retry (60 dtk bawaan terlalu sempit).
      test.setTimeout(90_000);

      const history = await requestImageWithRetry(url, labelForUrl(url), request);
      const last = history[history.length - 1];

      // Flakiness tetap terlihat di laporan, tetapi tidak menggagalkan test.
      if (history.length > 1) {
        console.log(`⚠️ ${labelForUrl(url)}: stabil pada percobaan ke-${history.length} (flaky sesaat).`);
      }

      // Pelaporan jelas: riwayat lengkap semua percobaan saat tetap gagal.
      expect(last.ok, [
        `Gambar "${labelForUrl(url)}" gagal dimuat setelah ${history.length} percobaan:`,
        ...history.map((h) => {
          const detail = h.status
            ? `HTTP ${h.status}, ${h.contentType}, ${h.bodyLength} B`
            : `error: ${h.error}`;
          return `  ✘ percobaan ${h.attempt}: ${detail} (${h.durationMs} ms)`;
        }),
        `\nURL: ${url}`,
      ].join('\n')).toBe(true);
    });
  }
});
