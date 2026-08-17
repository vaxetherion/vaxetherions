// scripts/download-assets.js
// Unduhan otomatis seluruh aset GitSkins ke ./assets/ sebagai cadangan
// lokal (fallback anti-kadaluarsa), lengkap dengan sanitasi SVG dan
// optimasi svgo. Mode tambahan:
//   --swap     : alihkan URL aset di README.md ke path lokal ./assets/
//   --restore  : kembalikan README.md ke URL GitSkins live

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GITSKINS_MANIFEST } from './gitskins.manifest.js';

const ASSETS_DIR = fileURLToPath(new URL('../assets/', import.meta.url));
const README_FILE = fileURLToPath(new URL('../README.md', import.meta.url));
const REQUEST_DELAY_MS = 250;   // jeda sopan antar-request (rate limit friendly)
const REQUEST_TIMEOUT_MS = 20_000;

// --- Fetch dengan timeout via AbortController -----------------------------
async function fetchWithTimeout(url, ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

// --- Validasi dasar: respons harus berupa dokumen SVG ----------------------
function looksLikeSvg(body) {
  return /<svg[\s>]/i.test(body.trimStart());
}

// --- Sanitasi SVG (defense in depth terhadap XSS) --------------------------
// SVG yang dimuat via <img> tidak mengeksekusi script di browser, namun
// pembersihan tetap dilakukan agar fallback lokal aman jika suatu saat
// dibuka langsung atau diproses ulang oleh pihak lain.
function sanitizeSvg(raw) {
  let out = raw;
  // Buang seluruh blok <script> ... </script>
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  // Buang elemen <foreignObject> (wadah HTML di dalam SVG)
  out = out.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');
  // Buang atribut event handler (onload, onerror, onclick, dst.)
  out = out.replace(/\son\w+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi, '');
  // Netralkan protokol javascript: pada atribut href / xlink:href
  out = out.replace(/(\bhref\s*=\s*["'])\s*javascript:/gi, '$1');
  return out;
}

// --- Optimasi svgo (opsional; dilewati jika paket tidak terpasang) ---------
async function optimizeSvg(content) {
  try {
    const { optimize } = await import('svgo');
    const result = await optimize(content, { multipass: true });
    return result.data;
  } catch {
    console.warn('⚠️  svgo tidak terpasang — lewati optimasi (jalankan: npm i -D svgo)');
    return content;
  }
}

// --- Unduh, validasi, sanitasi, dan optimasi satu aset ----------------------
async function downloadAsset(asset) {
  const target = `${ASSETS_DIR}${asset.name}.svg`;
  const response = await fetchWithTimeout(asset.url);

  if (!response.ok) {
    throw new Error(`[${asset.name}] HTTP ${response.status} — ${asset.url}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('image')) {
    throw new Error(`[${asset.name}] Content-Type bukan gambar: ${contentType}`);
  }

  const raw = await response.text();
  if (!looksLikeSvg(raw)) {
    throw new Error(`[${asset.name}] Respons bukan dokumen SVG yang valid`);
  }

  const sanitized = sanitizeSvg(raw);
  const optimized = await optimizeSvg(sanitized);
  writeFileSync(target, optimized, 'utf8');

  const savedPct = raw.length > 0 ? ((1 - optimized.length / raw.length) * 100).toFixed(1) : '0.0';
  return {
    name: asset.name,
    rawBytes: raw.length,
    finalBytes: optimized.length,
    savedPct,
    status: response.status,
  };
}

// --- Mode swap/restore: ubah referensi gambar di README.md ------------------
function swapReadme(mode) {
  let content = readFileSync(README_FILE, 'utf8');
  let changed = false;

  for (const asset of GITSKINS_MANIFEST) {
    const localRef = `./assets/${asset.name}.svg`;
    if (mode === 'swap' && content.includes(asset.url)) {
      content = content.split(asset.url).join(localRef);
      changed = true;
    } else if (mode === 'restore' && content.includes(localRef)) {
      content = content.split(localRef).join(asset.url);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(README_FILE, content, 'utf8');
    console.log(mode === 'swap'
      ? '🔁 README.md dialihkan ke aset lokal ./assets/'
      : '🔁 README.md dikembalikan ke URL GitSkins live');
  } else {
    console.log('ℹ️  Tidak ada referensi yang perlu diubah.');
  }
}

// --- Alur utama --------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--swap')) {
    swapReadme('swap');
    return;
  }
  if (args.includes('--restore')) {
    swapReadme('restore');
    return;
  }

  mkdirSync(ASSETS_DIR, { recursive: true });

  console.log('⬇️  Mengunduh aset GitSkins ke ./assets/ ...\n');
  const results = [];
  for (const asset of GITSKINS_MANIFEST) {
    try {
      const result = await downloadAsset(asset);
      results.push(result);
      console.log(`  ✔ ${result.name.padEnd(16)} HTTP ${result.status}  ${(result.rawBytes / 1024).toFixed(1)} KB → ${(result.finalBytes / 1024).toFixed(1)} KB  (hemat ${result.savedPct}%)`);
    } catch (error) {
      console.error(`  ✘ ${error.message}`);
      process.exitCode = 1;
    }
    // Jeda sopan antar-request
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  const totalRaw = results.reduce((sum, r) => sum + r.rawBytes, 0);
  const totalFinal = results.reduce((sum, r) => sum + r.finalBytes, 0);
  console.log(`\n📦 Total: ${results.length}/${GITSKINS_MANIFEST.length} aset tersimpan — ${(totalRaw / 1024).toFixed(1)} KB → ${(totalFinal / 1024).toFixed(1)} KB (hemat ${((1 - totalFinal / totalRaw) * 100).toFixed(1)}%)`);
  console.log('✅ Selesai. Aset lokal siap dipakai sebagai fallback.');
}

main();
