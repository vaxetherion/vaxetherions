#!/usr/bin/env bash
# scripts/clean-and-compress.sh
# Pembersihan artefak sisa & kompresi ukuran proyek sebelum commit.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧹 Menghapus artefak & berkas sementara..."

# Hapus direktori artefak jika ada
for target in dist .cache temp .playwright-artifacts test-results playwright-report; do
  if [ -d "$target" ]; then
    rm -rf "$target"
    echo "   - Hapus direktori: $target"
  fi
done

# Hapus berkas log di root proyek
for log in *.log; do
  if [ -e "$log" ]; then
    rm -f "$log"
    echo "   - Hapus berkas log: $log"
  fi
done

echo "📦 Membersihkan dependensi npm yang tidak terpakai (npm prune)..."
if [ -f package.json ]; then
  npm prune --no-audit --no-fund >/dev/null 2>&1 || echo "   (npm prune dilewati — bukan proyek npm atau npm tidak tersedia)"
fi

echo ""
echo "📏 Ukuran proyek setelah pembersihan:"
du -sh . 2>/dev/null | cut -f1

echo "✅ Pembersihan & kompresi proyek selesai!"
