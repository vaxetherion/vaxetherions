#!/usr/bin/env bash
# scripts/setup-hooks.sh
# Pasang git hooks untuk repo ini (termasuk pre-commit audit).
# Jalankan sekali setelah kloning repo: bash scripts/setup-hooks.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"

if [ ! -d "$ROOT_DIR/.git" ]; then
  echo "❌ Bukan direktori repositori Git. Jalankan dari root repositori." >&2
  exit 1
fi

mkdir -p "$HOOKS_DIR"

# --- Pre-commit: npm audit --------------------------------------------------
AUDIT_SRC="$ROOT_DIR/scripts/pre-commit-audit.sh"
AUDIT_DST="$HOOKS_DIR/pre-commit"

if [ -f "$AUDIT_SRC" ]; then
  cp "$AUDIT_SRC" "$AUDIT_DST"
  chmod +x "$AUDIT_DST"
  echo "✅ Pre-commit hook terpasang: .git/hooks/pre-commit"
else
  echo "⚠️  scripts/pre-commit-audit.sh tidak ditemukan — dilewati"
fi

echo ""
echo "🔍 Git hooks yang aktif:"
for hook in "$HOOKS_DIR"/*; do
  if [ -x "$hook" ]; then
    echo "   ✔ $(basename "$hook")"
  fi
done

echo ""
echo "💡 Untuk melewati hooks saat commit: git commit --no-verify"
