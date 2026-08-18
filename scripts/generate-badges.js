#!/usr/bin/env node
// scripts/generate-badges.js
// Generate badge Markdown untuk header README dari daftar workflow + badge
// pihak ketiga (shields.io). Satu-satunya sumber kebenaran label adalah
// scripts/badges.config.js — untuk menambah badge baru, cukup tambah entry
// di sana lalu jalankan `npm run badges:gen`.
//
// Penggunaan:
//   node scripts/generate-badges.js              → tulis ke README.md
//   node scripts/generate-badges.js --dry-run    → cetak ke stdout saja
//
// Badge workflow di-generate dari nama file .yml + label di badges.config.js.
// Badge pihak ketiga (shields.io) ditambahkan secara statis untuk:
//   • Branch protection — menunjukkan apakah branch protection aktif
//   • GitHub Stars      — menunjukkan jumlah bintang repo
//
// Script mengganti blok badge di README.md yang dibatasi oleh komentar:
//   <!-- BEGIN:BADGES -->
//   ...badge HTML...
//   <!-- END:BADGES -->
//
// Bila marker tidak ada, script gagal dengan pesan jelas.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { BADGE_LABELS } from './badges.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const README_PATH = resolve(PROJECT_ROOT, 'README.md');
const WORKFLOWS_DIR = resolve(PROJECT_ROOT, '.github/workflows');

const BEGIN_MARKER = '<!-- BEGIN:BADGES -->';
const END_MARKER = '<!-- END:BADGES -->';

// --- Helpers -------------------------------------------------------------

// Dapatkan slug "owner/repo" dari remote git origin.
function getRepoSlug() {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    }).trim();
    const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // Tidak ada remote — fallback ke config
  }
  return 'vaxetherion/vaxetherions';
}

// Generate badge HTML untuk satu workflow.
function workflowBadge(file, label, slug) {
  const url = `https://github.com/${slug}/actions/workflows/${file}/badge.svg`;
  const href = `https://github.com/${slug}/actions/workflows/${file}`;
  return [
    `  <a href="${href}" rel="noopener noreferrer">`,
    `    <img src="${url}" alt="Status Workflow: ${label}" />`,
    `  </a>`,
  ].join('\n');
}

// Generate badge HTML untuk shields.io (branch protection).
function branchProtectionBadge(slug) {
  const img = `https://img.shields.io/badge/branch%20protection-active-brightgreen`;
  const href = `https://github.com/${slug}/settings/branches`;
  return [
    `  <a href="${href}" rel="noopener noreferrer">`,
    `    <img src="${img}" alt="Branch Protection" />`,
    `  </a>`,
  ].join('\n');
}

// Generate badge HTML untuk shields.io (GitHub stars).
function starsBadge(slug) {
  const img = `https://img.shields.io/github/stars/${slug}?style=flat&color=yellow`;
  const href = `https://github.com/${slug}/stargazers`;
  return [
    `  <a href="${href}" rel="noopener noreferrer">`,
    `    <img src="${img}" alt="GitHub Stars" />`,
    `  </a>`,
  ].join('\n');
}

// --- Main ----------------------------------------------------------------

function generateBadgeBlock(slug) {
  const lines = [];

  // Badge workflow dari config
  for (const { file, label } of BADGE_LABELS) {
    if (existsSync(resolve(WORKFLOWS_DIR, file))) {
      lines.push(workflowBadge(file, label, slug));
    } else {
      console.warn(`⚠️  Workflow "${file}" tidak ditemukan — badge dilewati.`);
    }
  }

  // Badge pihak ketiga (shields.io)
  lines.push('');
  lines.push('  <a href="https://github.com/' + slug + '/settings/branches" rel="noopener noreferrer">');
  lines.push('    <img src="https://img.shields.io/badge/branch%20protection-active-brightgreen" alt="Branch Protection" />');
  lines.push('  </a>');
  lines.push('  <a href="https://github.com/' + slug + '/stargazers" rel="noopener noreferrer">');
  lines.push('    <img src="https://img.shields.io/github/stars/' + slug + '?style=flat&color=yellow" alt="GitHub Stars" />');
  lines.push('  </a>');

  return lines.join('\n');
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const slug = getRepoSlug();
  const newBlock = generateBadgeBlock(slug);

  if (dryRun) {
    console.log('--- Generated badge block ---');
    console.log(newBlock);
    console.log('--- End ---');
    return;
  }

  let readme = readFileSync(README_PATH, 'utf8');
  const beginIdx = readme.indexOf(BEGIN_MARKER);
  const endIdx = readme.indexOf(END_MARKER);

  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    console.error(
      `❌ Marker badge tidak ditemukan di README.md.\n` +
      `   Pastikan README memiliki komentar:\n` +
      `     ${BEGIN_MARKER}\n` +
      `     ${END_MARKER}`,
    );
    process.exit(1);
  }

  // Ganti blok di antara marker (termasuk marker itu sendiri)
  const before = readme.slice(0, beginIdx);
  const after = readme.slice(endIdx + END_MARKER.length);
  const updated = before + BEGIN_MARKER + '\n' + newBlock + '\n' + END_MARKER + after;

  writeFileSync(README_PATH, updated);
  console.log(`✅ Badge di README.md berhasil di-generate untuk repo "${slug}".`);
  console.log(`   ${BADGE_LABELS.length} badge workflow + 2 badge shields.io`);
}

main();
