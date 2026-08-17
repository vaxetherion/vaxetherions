// tests/readme.spec.js
// Suite E2E profil GitHub Aetherion:
//   1. Integritas README.md — seluruh aset GitSkins terpasang sebagai <img>.
//   2. Fallback lokal — setiap aset tersedia & bebas vektor script di ./assets/.
//   3. Ketersediaan API — setiap endpoint GitSkins mengembalikan HTTP 200
//      dengan Content-Type gambar dalam batas waktu yang longgar.
//      Endpoint pihak ketiga bisa flaky sesaat; tiap endpoint dicoba ulang
//      hingga 3× (jeda 1 dtk) sebelum dinyatakan gagal, dan riwayat semua
//      percobaan ikut dilaporkan agar penyebab jelas.
// Catatan: jalankan `npm run assets` terlebih dahulu (atau `npm test`).

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GITSKINS_MANIFEST } from '../scripts/gitskins.manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', 'README.md');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const README = readFileSync(README_PATH, 'utf8');

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
/* 3. Ketersediaan & performa API GitSkins                             */
/* ------------------------------------------------------------------ */
test.describe('Ketersediaan API GitSkins', () => {
  const ATTEMPTS = 3;
  const RETRY_DELAY_MS = 1_000;
  const REQUEST_TIMEOUT_MS = 20_000;
  const SLOW_MS = 20_000;

  // Minta endpoint dengan retry terbatas. Mengembalikan riwayat semua
  // percobaan; entry terakhir (history[history.length-1]) adalah hasil final.
  // `entry.ok` true hanya bila: HTTP 200 + Content-Type gambar + body tidak
  // kosong + durasi < SLOW_MS.
  async function requestAssetWithRetry(asset, request) {
    const history = [];
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const start = Date.now();
      let entry;
      try {
        const response = await request.get(asset.url, { timeout: REQUEST_TIMEOUT_MS });
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
          `  ↻ ${asset.name}: percobaan ${attempt} gagal (${entry.status ? `HTTP ${entry.status}` : entry.error}) — retry dalam ${RETRY_DELAY_MS} ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    return history;
  }

  for (const asset of GITSKINS_MANIFEST) {
    test(`HTTP 200 + Content-Type gambar: ${asset.name}`, async ({ request }) => {
      // Ruang untuk 3 percobaan × 20 dtk + jeda retry (60 dtk bawaan terlalu sempit).
      test.setTimeout(90_000);

      const history = await requestAssetWithRetry(asset, request);
      const last = history[history.length - 1];

      // Flakiness tetap terlihat di laporan, tetapi tidak menggagalkan test.
      if (history.length > 1) {
        console.log(`⚠️ ${asset.name}: stabil pada percobaan ke-${history.length} (flaky sesaat).`);
      }

      // Pelaporan jelas: riwayat lengkap semua percobaan saat tetap gagal.
      expect(last.ok, [
        `Endpoint "${asset.name}" gagal setelah ${history.length} percobaan:`,
        ...history.map((h) => {
          const detail = h.status
            ? `HTTP ${h.status}, ${h.contentType}, ${h.bodyLength} B`
            : `error: ${h.error}`;
          return `  ✘ percobaan ${h.attempt}: ${detail} (${h.durationMs} ms)`;
        }),
        `\nURL: ${asset.url}`,
      ].join('\n')).toBe(true);
    });
  }
});
