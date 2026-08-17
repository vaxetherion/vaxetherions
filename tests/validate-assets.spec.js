// tests/validate-assets.spec.js
// Unit test untuk scripts/validate-assets.js — perilaku deteksi aset lokal
// kosong/korup diuji dengan folder temp (tanpa menyentuh ./assets/ asli):
//   1. Semua aset valid          → ok, tanpa masalah
//   2. File tidak ditemukan      → terdeteksi
//   3. File kosong (0 byte)      → terdeteksi
//   4. Bukan dokumen SVG         → terdeteksi
//   5. Beberapa masalah sekaligus → semua terlaporkan
// (Berjalan via runner Playwright yang sudah dipakai suite ini.)

import { test, expect } from '@playwright/test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateAssets } from '../scripts/validate-assets.js';

const SVG_OK = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
const MANIFEST = [{ name: 'alpha' }, { name: 'beta' }];

let tmpDir;

test.beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), 'validate-assets-'));
});

test.afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeAsset(name, content) {
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(path.join(tmpDir, `${name}.svg`), content);
}

test('semua aset valid → ok tanpa masalah', () => {
  writeAsset('alpha', SVG_OK);
  writeAsset('beta', SVG_OK);

  const result = validateAssets({ assetsDir: `${tmpDir}/`, manifest: MANIFEST });

  expect(result.ok).toBe(true);
  expect(result.problems).toEqual([]);
});

test('file tidak ditemukan → terdeteksi', () => {
  writeAsset('alpha', SVG_OK);

  const result = validateAssets({ assetsDir: `${tmpDir}/`, manifest: MANIFEST });

  expect(result.ok).toBe(false);
  expect(result.problems.join('\n')).toContain('beta: file tidak ditemukan');
});

test('file kosong (0 byte) → terdeteksi', () => {
  writeAsset('alpha', '');
  writeAsset('beta', SVG_OK);

  const result = validateAssets({ assetsDir: `${tmpDir}/`, manifest: MANIFEST });

  expect(result.ok).toBe(false);
  expect(result.problems.join('\n')).toContain('alpha: file kosong (0 byte)');
});

test('bukan dokumen SVG → terdeteksi', () => {
  writeAsset('alpha', '<html><body>not an svg</body></html>');
  writeAsset('beta', SVG_OK);

  const result = validateAssets({ assetsDir: `${tmpDir}/`, manifest: MANIFEST });

  expect(result.ok).toBe(false);
  expect(result.problems.join('\n')).toContain('alpha: bukan dokumen SVG');
});

test('beberapa masalah sekaligus → semua terlaporkan', () => {
  writeAsset('alpha', '');

  const result = validateAssets({ assetsDir: `${tmpDir}/`, manifest: MANIFEST });

  expect(result.ok).toBe(false);
  expect(result.problems).toHaveLength(2);
});

test('assetsDir tanpa trailing slash tetap berfungsi', () => {
  writeAsset('alpha', SVG_OK);
  writeAsset('beta', SVG_OK);

  const result = validateAssets({ assetsDir: tmpDir, manifest: MANIFEST });

  expect(result.ok).toBe(true);
});
