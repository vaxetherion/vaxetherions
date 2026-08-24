// tests/check-badges.spec.js
// Unit test untuk scripts/check-badges.js — validasi badge workflow vs remote
// aktual pada banyak repo. Menguji fungsi murni (tanpa jaringan):
//   - ekstraksi URL badge dari teks README,
//   - perbandingan slug owner/repo (case-insensitive),
//   - resolusi daftar repo (CLI → env → repo saat ini).

import { test, expect } from '@playwright/test';
import {
  extractBadgeUrls,
  extractThirdPartyBadgeUrls,
  extractRepoSlugFromUrl,
  slugsMatch,
  resolveRepos,
} from '../scripts/check-badges.js';

/* ------------------------------------------------------------------ */
/* Ekstraksi URL badge                                                 */
/* ------------------------------------------------------------------ */
test.describe('check-badges: ekstraksi URL badge', () => {
  test('mengekstrak badge workflow beserta slug & nama file', () => {
    const readme = [
      '<img src="https://github.com/vaxetherion/vaxetherions/actions/workflows/refresh-assets.yml/badge.svg" />',
      '<img src="https://github.com/vaxetherion/vaxetherion/actions/workflows/remind-issue.yml/badge.svg" />',
    ].join('\n');

    const badges = extractBadgeUrls(readme);
    expect(badges).toHaveLength(2);
    expect(badges[0]).toEqual({
      url: 'https://github.com/vaxetherion/vaxetherions/actions/workflows/refresh-assets.yml/badge.svg',
      slug: 'vaxetherion/vaxetherions',
      workflow: 'refresh-assets.yml',
    });
    // badge kedua menunjuk nama repo yang salah — harus tetap terdeteksi
    expect(badges[1].slug).toBe('vaxetherion/vaxetherion');
  });

  test('tidak menghasilkan duplikat untuk URL yang sama', () => {
    const readme = `
      <img src="https://github.com/a/b/actions/workflows/x.yml/badge.svg" />
      <img src="https://github.com/a/b/actions/workflows/x.yml/badge.svg" />
    `;
    expect(extractBadgeUrls(readme)).toHaveLength(1);
  });

  test('mengembalikan daftar kosong untuk teks tanpa badge', () => {
    expect(extractBadgeUrls('tidak ada gambar di sini')).toHaveLength(0);
    expect(extractBadgeUrls('https://github.com/a/b/actions/workflows/x.yml')).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* Badge pihak ketiga (shields.io, Codecov, badgen.net)                */
/* ------------------------------------------------------------------ */
test.describe('check-badges: ekstraksi badge pihak ketiga', () => {
  test('mengekstrak badge dari <img src> maupun markdown ![alt](url)', () => {
    const readme = [
      '<img src="https://img.shields.io/github/stars/vaxetherion/vaxetherions" />',
      '![Codecov](https://codecov.io/gh/vaxetherion/vaxetherions/branch/main/graph/badge.svg)',
      '![Badgen](https://badgen.net/npm/v/express)',
    ].join('\n');

    const urls = extractThirdPartyBadgeUrls(readme);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe('https://img.shields.io/github/stars/vaxetherion/vaxetherions');
    expect(urls[1]).toBe('https://codecov.io/gh/vaxetherion/vaxetherions/branch/main/graph/badge.svg');
  });

  test('mengabaikan gambar non-badge (mis. gitskins.com) dan provider lain', () => {
    const readme = [
      '<img src="https://www.gitskins.com/api/readme-reference/hero?username=vaxetherion&theme=neon" />',
      '![gravatar](https://secure.gravatar.com/avatar/abc)',
    ].join('\n');
    expect(extractThirdPartyBadgeUrls(readme)).toHaveLength(0);
  });

  test('menangkap badge bergaya reference-style markdown ([label]: url)', () => {
    const readme = [
      '[![NPM Version][npm-image]][npm-url]',
      '',
      '[npm-image]: https://img.shields.io/npm/v/express.svg',
      '[codecov]: https://codecov.io/gh/expressjs/express/branch/master/graph/badge.svg',
    ].join('\n');
    const urls = extractThirdPartyBadgeUrls(readme);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe('https://img.shields.io/npm/v/express.svg');
    expect(urls[1]).toBe('https://codecov.io/gh/expressjs/express/branch/master/graph/badge.svg');
  });

  test('tidak menghasilkan duplikat untuk URL yang sama', () => {
    const readme = [
      '![x](https://badgen.net/npm/v/express)',
      '![y](https://badgen.net/npm/v/express)',
    ].join('\n');
    expect(extractThirdPartyBadgeUrls(readme)).toHaveLength(1);
  });
});

test.describe('check-badges: ekstraksi slug dari URL pihak ketiga', () => {
  test('Codecov /gh/<owner>/<repo> diekstrak sebagai slug', () => {
    expect(
      extractRepoSlugFromUrl('https://codecov.io/gh/vaxetherion/vaxetherions/branch/main/graph/badge.svg'),
    ).toBe('vaxetherion/vaxetherions');
  });

  test('bentuk tidak deterministik (shields.io) atau bukan /gh/ → null', () => {
    expect(extractRepoSlugFromUrl('https://img.shields.io/github/stars/vaxetherion/vaxetherions')).toBeNull();
    expect(extractRepoSlugFromUrl('https://codecov.io/bb/owner/repo')).toBeNull();
    expect(extractRepoSlugFromUrl('https://badgen.net/npm/v/express')).toBeNull();
  });

  test('URL tidak valid → null', () => {
    expect(extractRepoSlugFromUrl('not-a-url')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Perbandingan slug owner/repo                                        */
/* ------------------------------------------------------------------ */
test.describe('check-badges: perbandingan slug', () => {
  test('cocok secara case-insensitive (nama repo GitHub tidak peka huruf)', () => {
    expect(slugsMatch('Vaxetherion/Vaxetherions', 'vaxetherion/vaxetherions')).toBe(true);
  });

  test('tidak cocok bila repo berbeda (mis. tanpa huruf s)', () => {
    expect(slugsMatch('vaxetherion/vaxetherion', 'vaxetherion/vaxetherions')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Resolusi daftar repo                                                */
/* ------------------------------------------------------------------ */
test.describe('check-badges: resolusi daftar repo', () => {
  test('argumen CLI diprioritaskan di atas env & repo saat ini', () => {
    expect(resolveRepos(['owner/a', 'owner/b'], 'owner/env', 'owner/current')).toEqual([
      'owner/a',
      'owner/b',
    ]);
  });

  test('flag (--help) diabaikan saat memilih argumen repo', () => {
    expect(resolveRepos(['--help', 'owner/a'], '', 'owner/current')).toEqual(['owner/a']);
  });

  test('env BADGE_CHECK_REPOS sebagai fallback, dengan pembersihan spasi', () => {
    expect(resolveRepos([], 'owner/a, owner/b , owner/c', 'owner/current')).toEqual([
      'owner/a',
      'owner/b',
      'owner/c',
    ]);
  });

  test('repo saat ini sebagai default terakhir', () => {
    expect(resolveRepos([], '', 'owner/current')).toEqual(['owner/current']);
  });

  test('null bila tidak ada sumber sama sekali', () => {
    expect(resolveRepos([], '', null)).toBeNull();
  });
});
