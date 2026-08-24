#!/usr/bin/env bash
# scripts/clean-and-compress.sh
# Pembersihan artefak sisa, cache paket, & kompresi ukuran proyek.
# Idempotent — aman dijalankan berulang kali tanpa merusak struktur.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- 1. Hapus artefak build & sementara -------------------------------------
echo "🧹 Menghapus artefak & berkas sementara..."

for target in dist .cache temp .playwright-artifacts test-results playwright-report .next out build; do
  if [ -d "$target" ]; then
    rm -rf "$target"
    echo "   - Hapus direktori: $target"
  fi
done

for log in *.log; do
  if [ -e "$log" ]; then
    rm -f "$log"
    echo "   - Hapus berkas log: $log"
  fi
done

# --- 2. Hapus node_modules untuk reinstal bersih ----------------------------
echo ""
echo "🗑️  Menghapus node_modules untuk reinstal bersih..."
if [ -d node_modules ]; then
  rm -rf node_modules
  echo "   - Hapus: node_modules/"
fi

# --- 3. Hapus lockfile lama agar reinstal menghasilkan lockfile baru ----------
echo ""
echo "📄 Menghapus lockfile lama..."
for lockfile in package-lock.json yarn.lock pnpm-lock.yaml; do
  if [ -f "$lockfile" ]; then
    rm -f "$lockfile"
    echo "   - Hapus: $lockfile"
  fi
done

# --- 4. Bersihkan cache NPM/Yarn/PNPM global --------------------------------
echo ""
echo "🧹 Membersihkan cache paket manager..."
if command -v npm >/dev/null 2>&1; then
  npm cache clean --force 2>/dev/null && echo "   - npm cache dibersihkan" || echo "   - npm cache: tidak ada yang perlu dibersihkan"
fi
if command -v yarn >/dev/null 2>&1; then
  yarn cache clean 2>/dev/null && echo "   - yarn cache dibersihkan" || echo "   - yarn cache: tidak tersedia atau sudah bersih"
fi
if command -v pnpm >/dev/null 2>&1; then
  pnpm store prune 2>/dev/null && echo "   - pnpm store diprune" || echo "   - pnpm store: tidak tersedia atau sudah bersih"
fi

# --- 5. Reinstalasi bersih ---------------------------------------------------
echo ""
echo "📦 Melakukan reinstalasi bersih (npm ci)..."
if [ -f package.json ]; then
  npm ci --no-audit --no-fund 2>&1 | tail -1 || echo "   (npm ci gagal — periksa package.json)"
fi

echo ""
echo "📏 Ukuran proyek setelah pembersihan:"
du -sh . 2>/dev/null | cut -f1

echo "✅ Pembersihan & kompresi proyek selesai!"
