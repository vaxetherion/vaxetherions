// scripts/validate-assets.js
// Validasi integritas aset fallback lokal di ./assets/ (anti-kosong & anti-korup).
// Untuk setiap entri GITSKINS_MANIFEST dicek:
//   1) file assets/<nama>.svg ada
//   2) file tidak kosong (0 byte)
//   3) isi file adalah dokumen SVG (<svg)
//
// Dipakai oleh:
//   - CLI      : `node scripts/validate-assets.js` — exit 0 bila semua aset
//                valid, exit 1 bila ada masalah (workflow memakainya untuk
//                memicu issue otomatis, bukan hanya saat API GitSkins gagal).
//   - Unit test: fungsi `validateAssets()` diekspor (tests/validate-assets.spec.js).

import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GITSKINS_MANIFEST } from './gitskins.manifest.js';

const ASSETS_DIR = fileURLToPath(new URL('../assets/', import.meta.url));

// Validasi inti — tanpa efek samping (tidak mencetak apa pun), agar mudah diuji.
// Mengembalikan { ok, problems } dengan daftar masalah berformat `❌ <aset>: <alasan>`.
export function validateAssets({ assetsDir = ASSETS_DIR, manifest = GITSKINS_MANIFEST } = {}) {
  const dir = assetsDir.endsWith('/') || assetsDir.endsWith('\\') ? assetsDir : `${assetsDir}/`;
  const problems = [];

  for (const asset of manifest) {
    const file = `${dir}${asset.name}.svg`;

    if (!existsSync(file)) {
      problems.push(`❌ ${asset.name}: file tidak ditemukan (assets/${asset.name}.svg)`);
      continue;
    }

    const stat = statSync(file);
    if (stat.size === 0) {
      problems.push(`❌ ${asset.name}: file kosong (0 byte)`);
      continue;
    }

    const content = readFileSync(file, 'utf8');
    if (!/<svg[\s>]/i.test(content.trimStart())) {
      problems.push(`❌ ${asset.name}: bukan dokumen SVG yang valid`);
    }
  }

  return { ok: problems.length === 0, problems };
}

// Entry CLI — hanya berjalan saat file dieksekusi langsung (bukan diimpor).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ok, problems } = validateAssets();

  if (!ok) {
    console.error('🚨 Aset fallback lokal bermasalah:');
    console.error(problems.join('\n'));
    console.error('\n💡 Perbaikan: jalankan `npm run assets` untuk mengunduh ulang,');
    console.error('   atau pulihkan file dari commit terakhir yang sehat.');
    process.exit(1);
  }

  console.log(`✅ ${GITSKINS_MANIFEST.length}/${GITSKINS_MANIFEST.length} aset fallback lokal valid (ada, tidak kosong, format SVG).`);
}
