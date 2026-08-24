#!/usr/bin/env bash
# scripts/pre-commit-audit.sh
# Pre-commit hook: menjalankan npm audit untuk mendeteksi vulnerabilitas kritis
# sebelum commit dibuat. Dipanggil oleh .git/hooks/pre-commit.
#
# Instalasi (sekali saja):
#   bash scripts/setup-hooks.sh
#
# Atau manual:
#   cp scripts/pre-commit-audit.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

set -euo pipefail

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Menjalankan npm audit sebelum commit..."

# Cek apakah npm tersedia
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  npm tidak ditemukan — audit dilewati${NC}"
  exit 0
fi

# Jalankan npm audit — exit code != 0 jika ada vulnerabilitas
AUDIT_OUTPUT=""
AUDIT_EXIT=0

if [ -f "package-lock.json" ]; then
  AUDIT_OUTPUT=$(npm audit --audit-level=critical 2>&1) || AUDIT_EXIT=$?
else
  echo -e "${YELLOW}⚠️  package-lock.json tidak ditemukan — audit dilewati${NC}"
  exit 0
fi

if [ "$AUDIT_EXIT" -eq 0 ]; then
  echo -e "${GREEN}✅ npm audit: tidak ada vulnerabilitas kritis ditemukan${NC}"
  exit 0
fi

# Cek apakah kegagalan karena jaringan (bukan vulnerabilitas aktual)
if echo "$AUDIT_OUTPUT" | grep -qiE 'network|ENOTFOUND|ECONNREFUSED|fetch|timeout|ECONNRESET'; then
  echo -e "${YELLOW}⚠️  npm audit: gagal terhubung ke registry — audit dilewati (offline mode)${NC}"
  exit 0
fi

# Kegagalan audit aktual (vulnerabilitas ditemukan)
echo ""
echo -e "${RED}🚨 npm audit menemukan vulnerabilitas kritis!${NC}"
echo ""
echo "$AUDIT_OUTPUT" | head -30
echo ""
echo -e "${YELLOW}💡 Opsi:${NC}"
echo -e "   1. Perbaiki: ${GREEN}npm audit fix${NC}"
echo -e "   2. Force fix: ${GREEN}npm audit fix --force${NC} (hati-hati)"
echo -e "   3. Lewati audit (TIDAK DISARANKAN): ${GREEN}git commit --no-verify${NC}"
echo ""
echo -e "${RED}❌ Commit dibatalkan. Perbaiki vulnerabilitas terlebih dahulu.${NC}"
exit 1
