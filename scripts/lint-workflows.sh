#!/usr/bin/env bash
# scripts/lint-workflows.sh
# Lint seluruh GitHub Actions (workflow + composite action) dengan actionlint.
#
# Binary actionlint diunduh otomatis SEKALI ke cache proyek
# (.cache/actionlint — sudah masuk .gitignore), jadi tidak perlu
# mengunduh/menginstal manual. Bila binary sudah ada di PATH atau cache,
# unduhan dilewati.
#
# Penggunaan : npm run lint
# Override   : ACTIONLINT_CACHE_DIR=/path bash scripts/lint-workflows.sh
set -euo pipefail

cd "$(dirname "$0")/.."   # pastikan berjalan dari root repo

VERSION="1.7.12"
CACHE_DIR="${ACTIONLINT_CACHE_DIR:-.cache/actionlint}"
BIN="$CACHE_DIR/actionlint-$VERSION"

# Pakai actionlint dari PATH bila tersedia (versi apa pun) — hindari unduhan.
if command -v actionlint >/dev/null 2>&1; then
  BIN="$(command -v actionlint)"
fi

if [ ! -x "$BIN" ]; then
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  case "$OS-$ARCH" in
    Linux-x86_64|Linux-amd64)    ASSET="actionlint_${VERSION}_linux_amd64";  EXT="tar.gz" ;;
    Linux-aarch64|Linux-arm64)   ASSET="actionlint_${VERSION}_linux_arm64";  EXT="tar.gz" ;;
    Darwin-x86_64|Darwin-amd64)  ASSET="actionlint_${VERSION}_darwin_amd64"; EXT="tar.gz" ;;
    Darwin-arm64)                ASSET="actionlint_${VERSION}_darwin_arm64"; EXT="tar.gz" ;;
    MINGW*|MSYS*|CYGWIN*)        ASSET="actionlint_${VERSION}_windows_amd64"; EXT="zip" ;;
    *)
      echo "⚠️ actionlint tidak tersedia otomatis untuk $OS-$ARCH." >&2
      echo "   Install manual: https://github.com/rhysd/actionlint/releases" >&2
      exit 0
      ;;
  esac

  mkdir -p "$CACHE_DIR"
  URL="https://github.com/rhysd/actionlint/releases/download/v${VERSION}/${ASSET}.${EXT}"
  echo "⬇️  Mengunduh actionlint v${VERSION} → $CACHE_DIR (satu kali)"

  if [ "$EXT" = "zip" ]; then
    command -v unzip >/dev/null 2>&1 || { echo "❌ 'unzip' diperlukan di Windows (Git Bash)." >&2; exit 1; }
    curl -sSL -o "$CACHE_DIR/actionlint.zip" "$URL"
    unzip -o -q "$CACHE_DIR/actionlint.zip" -d "$CACHE_DIR"
    mv -f "$CACHE_DIR/actionlint.exe" "$BIN.exe"
    BIN="$BIN.exe"
    rm -f "$CACHE_DIR/actionlint.zip"
  else
    curl -sSL -o "$CACHE_DIR/actionlint.tar.gz" "$URL"
    tar -xzf "$CACHE_DIR/actionlint.tar.gz" -C "$CACHE_DIR" actionlint
    mv -f "$CACHE_DIR/actionlint" "$BIN"
    chmod +x "$BIN"
    rm -f "$CACHE_DIR/actionlint.tar.gz"
  fi
fi

echo "🔍 actionlint: $("$BIN" -version 2>/dev/null | head -1 || echo "v$VERSION")"
# Auto-discovery: lint .github/workflows/**/*.yml + .github/actions/**/action.yml
"$BIN" -color
