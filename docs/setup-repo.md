# 🚀 Setup Repo — dari Kloning hingga Live di GitHub

Panduan langkah demi langkah untuk membawa repo ini dari kondisi kosong
(**)menjadi profil GitHub yang hidup dengan otomasi penuh. Ditulis untuk
Aetherion, berlaku untuk siapa pun yang memegang repo.

---

## 1. Prasyarat

| Kebutuhan | Versi | Catatan |
| :--- | :--- | :--- |
| Git | ≥ 2.40 | `git --version` |
| Node.js | 20 | `node --version` — wajib 18+ (fetch global) |
| npm | 9+ | ikut terpasang bersama Node |
| gh CLI (opsional) | ≥ 2.40 | hanya untuk `scripts/enable-branch-protection.sh` |
| Akun GitHub | — | repo `vaxetherion/vaxetherion` (profil) |

---

## 2. Siapkan salinan lokal

```bash
# 1) Masuk ke direktori repo (sudah ada isinya di workspace ini)
cd <folder-repo>

# 2) Pasang dependensi
npm ci

# 3) Cek pipeline lokal berjalan hijau (unduh aset + validasi + lint + E2E)
npm test
```

> ℹ️ `npm test` mengunduh 10 aset GitSkins ke `./assets/`, memvalidasi
> integritasnya, melint workflow dengan actionlint, lalu menjalankan suite E2E
> (integritas README, fallback lokal, dan 10 endpoint API live).

---

## 3. Urutan commit pertama

Repo ini **belum memiliki commit sama sekali**. Urutan berikut memecah
inisialisasi menjadi 5 commit yang logis — setiap langkah boleh diverifikasi
dengan `npm test` sebelum lanjut.

> ⚠️ **Jangan commit `.freebuff/`** (folder alat kerja lokal — sudah masuk
> `.gitignore`). Hanya file yang terdaftar di `git status` yang relevan.

```bash
# Commit 1 — kerangka proyek
git add .gitignore package.json package-lock.json playwright.config.js
git commit -m "chore: inisialisasi proyek profil vaxetherion

Scaffolding dasar: konfigurasi Node/npm, Playwright, dan gitignore."

# Commit 2 — pipeline aset GitSkins + fallback lokal
git add scripts/ assets/
git commit -m "feat(assets): pipeline unduh/optimasi aset GitSkins + fallback lokal

- scripts/download-assets.js: unduh, sanitasi SVG, optimasi svgo
- scripts/gitskins.manifest.js: single source of truth URL aset
- scripts/validate-assets.js: deteksi aset lokal kosong/korup
- scripts/lint-workflows.sh: lint actionlint (unduh otomatis ke cache)
- assets/: 10 SVG fallback lokal (anti-kadaluarsa)"

# Commit 3 — suite pengujian
git add tests/
git commit -m "test: suite E2E README, fallback lokal, dan API (dengan retry)"

# Commit 4 — dokumentasi
git add README.md SECURITY.md docs/
git commit -m "docs: README profil, playbook darurat, dan analisis keamanan"

# Commit 5 — otomasi GitHub Actions
git add .github/
git commit -m "ci: otomasi workflow refresh, remind, dan PR validation

- refresh-assets.yml: refresh mingguan + issue otomatis (buka/tutup, label,
  assign, komentar diagnosa) + notifikasi Discord/Telegram + peringatan durasi
- remind-issue.yml: pengingat harian untuk issue terbuka > 3 hari
- pr-validation.yml: lint actionlint + suite tes sebelum merge
- .github/actions/notify: composite action notifikasi terpusat"

# Verifikasi akhir sebelum push
git log --oneline && npm test
```

---

## 4. Push ke GitHub

```bash
# 1) Tambahkan remote (ganti URL bila username/org lain)
git remote add origin git@github.com:vaxetherion/vaxetherion.git

# 2) Push pertama
git push -u origin main
```

Setelah push, di tab **Actions** seharusnya langsung muncul run
`Refresh GitSkins Assets` (path `scripts/**` ikut berubah di commit pertama).

---

## 5. Konfigurasi secret (opsional — notifikasi)

Notifikasi Discord/Telegram otomatis **dilewati** bila secret belum diisi.
Untuk mengaktifkannya (lihat `docs/playbook-darurat.md` §9):

```bash
# Discord: buat webhook di server Discord, lalu:
gh secret set DISCORD_WEBHOOK_URL

# Telegram: buat bot via @BotFather, lalu (keduanya wajib terisi bersamaan):
gh secret set TELEGRAM_BOT_TOKEN
gh secret set TELEGRAM_CHAT_ID
```

Atau lewat UI: *Settings → Secrets and variables → Actions*.

---

## 6. Aktifkan branch protection untuk main

Setelah repo live, lindungi `main` agar **PR Validation wajib lolos sebelum
merge**:

```bash
bash scripts/enable-branch-protection.sh
```

Skrip tersebut (via `gh api`) menetapkan: status check **PR Validation** wajib
lolos + branch harus up-to-date. Alternatif manual: *Settings → Branches →
Add branch protection rule* dengan pola `main` → centang *Require status checks
to pass before merging* → pilih **PR Validation** → *Create*.

---

## 7. Verifikasi akhir

1. **Badge workflow** di README menampilkan status run terbaru (hijau).
2. **Run manual**: tab *Actions* → *Refresh GitSkins Assets* → *Run workflow*.
3. **Uji alur insiden**: rusakkan sementara satu aset lokal
   (`echo > assets/stats.svg`), push ke branch baru, buka PR — PR Validation
   harus merah karena `validate_local_assets`; kembalikan, PR menjadi hijau.
4. **Buka PR pertama** dengan perubahan kecil untuk memastikan
   `pr-validation.yml` berjalan di PR.

---

## 8. Perawatan rutin

- **Mingguan** — workflow otomatis memperbarui aset; pastikan tidak ada run
  merah yang dibiarkan (issue otomatis akan menandainya).
- **Saat endpoint GitSkins berubah** — perbarui `scripts/gitskins.manifest.js`,
  lalu `npm run assets` dan commit.
- **Saat mengubah workflow** — jalankan `npm run lint` + `npm test` lokal;
  PR Validation di GitHub akan mengonfirmasi.

---

*Berkaitan: [playbook darurat](playbook-darurat.md) untuk insiden, dan
[analisis keamanan](../SECURITY.md) untuk konteks risiko integrasi GitSkins.*
