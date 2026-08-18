// scripts/badges.config.js
// Registry tunggal label badge workflow — single source of truth untuk
// skrip generate-badges.js dan validasi badge-count di tests/readme.spec.js.
//
// Struktur: { file, label } — file adalah nama file YAML di .github/workflows/,
// label adalah teks alt badge di README.
//
// Untuk menambah badge workflow baru:
//   1) Tambah entry di sini (pastikan file .yml ada di .github/workflows/).
//   2) Jalankan `npm run badges:gen` untuk regenerate badge di README.
//   3) Commit perubahan.

export const BADGE_LABELS = [
  { file: 'refresh-assets.yml', label: 'Refresh GitSkins Assets' },
  { file: 'remind-issue.yml',   label: 'Remind Open GitSkins Issue' },
  { file: 'badges-check.yml',   label: 'Check Workflow Badges' },
  { file: 'pr-validation.yml',  label: 'PR Validation' },
];
