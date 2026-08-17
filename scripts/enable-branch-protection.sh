#!/usr/bin/env bash
# scripts/enable-branch-protection.sh
# Terapkan branch protection untuk branch `main`: status check "PR Validation"
# (workflow pr-validation.yml) WAJIB lolos sebelum merge, dan branch harus
# up-to-date terhadap main.
#
# Prasyarat :
#   - Repo sudah di-push ke GitHub (jalankan skrip ini SETELAH repo live).
#   - gh CLI terpasang & sudah login: gh auth login
#
# Penggunaan :
#   bash scripts/enable-branch-protection.sh            # pakai remote origin
#   bash scripts/enable-branch-protection.sh owner/repo # atau tentukan manual
#
# Alternatif manual (UI) — Settings → Branches → Add branch protection rule:
#   - Branch name pattern : main
#   - Require status checks to pass before merging → cari "PR Validation"
#   - Require branches to be up to date before merging
#   - Create
set -euo pipefail

REPO="${1:-}"
if [ -z "$REPO" ]; then
  REPO="$(git remote get-url origin 2>/dev/null || true)"
  REPO="$(printf '%s' "$REPO" | sed -E 's#.*github.com[:/]([^/]+/[^/]+)(\.git)?$#\1#')"
fi
REPO="${REPO:-vaxetherion/vaxetherion}"

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI tidak terpasang. Install: https://cli.github.com" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ Belum login. Jalankan: gh auth login" >&2
  exit 1
fi

echo "🔒 Menerapkan branch protection untuk $REPO:main"
echo "   - Required status check : PR Validation"
echo "   - Branches up-to-date   : true (strict)"
echo "   - Enforce admins        : false"
echo "   - Required reviews      : none (tidak diubah)"

gh api -X PUT "repos/$REPO/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["PR Validation"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON

echo "✅ Branch protection aktif: pull request ke main harus lolos 'PR Validation' sebelum merge."
