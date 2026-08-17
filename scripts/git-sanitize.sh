#!/usr/bin/env bash
# scripts/git-sanitize.sh
# Mengunci identitas Git tunggal milik vaxetherion / roufprivate@gmail.com
# dan (secara opsional) membersihkan riwayat commit dari identitas lain.

set -euo pipefail

# Pastikan dijalankan di dalam repositori Git
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Bukan direktori repositori Git. Jalankan dari root repositori." >&2
  exit 1
fi

echo "👤 Mengonfigurasi identitas Git tunggal..."
git config user.name "vaxetherion"
git config user.email "roufprivate@gmail.com"

echo "🔎 Verifikasi identitas aktif:"
echo "   user.name  = $(git config user.name)"
echo "   user.email = $(git config user.email)"

# ---------------------------------------------------------------------------
# Mode berbahaya: tulis ulang riwayat commit (DEFAULT: NONAKTIF)
# Aktifkan secara sadar dengan: REWRITE_HISTORY=1 ./scripts/git-sanitize.sh
# Catatan: filter-branch sudah usang (deprecated); pastikan Anda memahami
# konsekuensi rewrite history sebelum mengaktifkan mode ini.
# ---------------------------------------------------------------------------
if [ "${REWRITE_HISTORY:-0}" = "1" ]; then
  echo "⚠️  Mode REWRITE_HISTORY aktif — menulis ulang seluruh riwayat commit..."
  git filter-branch -f --env-filter '
    export GIT_AUTHOR_NAME="vaxetherion"
    export GIT_AUTHOR_EMAIL="roufprivate@gmail.com"
    export GIT_COMMITTER_NAME="vaxetherion"
    export GIT_COMMITTER_EMAIL="roufprivate@gmail.com"
  ' -- --all
  echo "✅ Riwayat commit telah disanitasi."
  echo "⚠️  JANGAN push --force ke remote publik tanpa persetujuan pemilik repositori!"
else
  echo "ℹ️  Riwayat commit TIDAK diubah (mode aman)."
fi

echo "✅ Sanitasi identitas Git selesai!"
