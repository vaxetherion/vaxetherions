# 🚨 Playbook Darurat — "⚠️ Widget GitSkins gagal dimuat"

> Dokumen ini adalah panduan langkah demi langkah untuk **Aetherion** (atau siapa pun
> yang memegang repo) saat issue **`⚠️ Widget GitSkins gagal dimuat`** muncul di GitHub.
> Tujuan utama: **memulihkan tampilan profil secepat mungkin**, lalu memperbaiki akar masalah.

---

## 1. Gambaran umum

| Hal | Detail |
| :--- | :--- |
| **Judul issue** | `⚠️ Widget GitSkins gagal dimuat` |
| **Pembuat** | Bot GitHub Actions — workflow `Refresh GitSkins Assets` (`.github/workflows/refresh-assets.yml`) |
| **Kapan dibuat** | Otomatis, saat run workflow gagal — baik karena API GitSkins bermasalah **maupun** aset fallback lokal di repo kosong/korup (`validate_local_assets`) |
| **Kapan ditutup** | **Otomatis** pada run berikutnya yang sukses (step baru di workflow). Bisa juga ditutup manual |
| **Komentar otomatis** | Workflow menambahkan komentar **"Ringkasan diagnosa awal"** berisi step mana yang gagal — tanpa perlu membuka log |
| **Label otomatis** | Issue langsung diberi label **`bug`** dan **`automation`** (dibuat otomatis bila belum ada) |
| **Assign otomatis** | Issue langsung di-assign ke **pemilik repo** (`vaxetherion`) |
| **Pengingat otomatis** | Workflow harian `remind-issue.yml` mengomentari issue yang terbuka **> 3 hari**, diulang tiap 3 hari hingga ditutup |
| **Peringatan durasi** | Notifikasi bila run workflow berlangsung **> 10 menit** (batas timeout 15 menit) |
| **Notifikasi eksternal** | **Discord** (secret `DISCORD_WEBHOOK_URL`) dan/atau **Telegram** (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`) — opsional; terkirim ke semua kanal yang terisi, saat issue dibuat, run pulih, run > 10 menit, & pengingat issue lama |
| **Dampak** | Widget gambar profil (hero, stats, heatmap, dsb.) berpotensi gagal tampil di README |

**Siklus hidup otomatis:**

```
Run workflow GAGAL  ──►  issue "⚠️ Widget GitSkins gagal dimuat" DIBUKA otomatis
                        ├──► label "bug" + "automation" + assign ke vaxetherion
                        ├──► komentar ringkasan diagnosa + notifikasi Discord/Telegram 🚨
                        └──► issue terbuka > 3 hari  →  pengingat harian ⏰ (tiap 3 hari)
Run berikutnya OK   ──►  issue DITUTUP otomatis (komentar konfirmasi)
                        ├──► notifikasi "run pulih" ✅
                        └──► run > 10 menit       →  peringatan durasi ⏱️
```

**Aturan emas:** jangan panik, dan jangan langsung mengutak-atik kode.
Ikuti urutan di bawah. Prioritas nomor satu adalah **profil tetap tampil bagus**,
bukan segera memperbaiki API GitSkins.

---

## 2. TL;DR — Alur keputusan cepat

```
Issue muncul?
│
├─ 1. Baca komentar "🔍 Ringkasan diagnosa awal" di issue ──► step mana yang gagal
│      (opsional: notifikasi Discord/Telegram 🚨 sudah terkirim otomatis)
│
├─ 2. MITIGASI SEGERA (2 menit):
│      npm run assets:swap   → alihkan README ke aset lokal ./assets/
│      commit + push         → profil langsung pulih, tampil dari fallback lokal
│
├─ 3. DIAGNOSA (setelah profil aman):
│      npm run assets        → jalankan unduhan lokal, lihat aset mana yang error
│      cek endpoint di browser / curl
│
├─ 4. PERBAIKI:
│      - Endpoint berubah?      → perbarui scripts/gitskins.manifest.js
│      - API down sementara?    → tunggu pulih (fallback lokal tetap aktif)
│
├─ 5. PULIHKAN mode live:
│      npm run assets:restore → kembalikan README ke URL GitSkins
│      npm test               → pastikan hijau
│      commit + push
│
└─ 6. VALIDASI & TUTUP:
       Trigger workflow manual → step auto-close menutup issue
       (atau tutup manual + komentar penjelasan)
       Notifikasi ✅ "run pulih" terkirim otomatis
```

---

## 3. Langkah 1 — Kenali & verifikasi

1. **Baca body issue.** Workflow otomatis menyertakan tautan langsung ke log run:
   `Log: https://github.com/vaxetherion/vaxetherion/actions/runs/<RUN_ID>`.
2. **Baca komentar pertama issue** — berjudul *"🔍 Ringkasan diagnosa awal (otomatis)"*.
   Komentar ini sudah menyebutkan **step mana yang gagal** (mis. `e2e_validate`
   atau `validate_local_assets`), jadi kamu tidak perlu membuka log untuk tahu
   titik gagalnya.
3. **Buka tab Actions** → klik run tersebut → buka step yang gagal untuk melihat
   detail masalahnya:
   - **`validate_local_assets`** → aset fallback lokal kosong/korup
     (lihat baris `❌ <nama-aset>`).
   - **`download_assets` / `e2e_validate`** → endpoint API bermasalah
     (baris `✘` dengan status HTTP / alasan).
4. **Catat aset yang gagal** dari output, misalnya:
   - `✘ [stats] HTTP 503 — https://www.gitskins.com/api/section/stats?...`
   - `✘ [portrait] Respons bukan dokumen SVG yang valid`
   - `❌ stats: file kosong (0 byte)`
   - `❌ hero-neon: file tidak ditemukan (assets/hero-neon.svg)`
5. **Periksa profil sekarang:** buka README repo — apakah gambar sudah tampak
   rusak/placeholder? Jika iya, lanjut segera ke **Langkah 2**.

> 💡 Pola umum kegagalan:
> - **HTTP 5xx / timeout** → kemungkinan API GitSkins sedang down/lam. *Tunggu + fallback.*
> - **HTTP 404 / Content-Type bukan gambar** → endpoint atau parameter berubah. *Perbaiki manifest.*
> - **"Respons bukan dokumen SVG"** → endpoint mengembalikan HTML/error page. *Perbaiki manifest atau tunggu.*

---

## 4. Langkah 2 — Mitigasi segera: rollback ke fallback lokal

Tindakan ini **paling penting**. README akan dialihkan dari URL GitSkins live
ke file SVG lokal di `./assets/` — profil tetap tampil sempurna meski API bermasalah.

```bash
# 1. Alihkan semua gambar README ke aset lokal
npm run assets:swap

# 2. Cek perubahan (hanya README.md yang berubah)
git diff --stat

# 3. Commit & push — profil langsung pulih
git add README.md
git commit -m "fix(assets): alihkan sementara ke fallback lokal [skip ci]"
git push
```

**Hasil:** README sekarang memakai `./assets/*.svg` — bebas dari kondisi API GitSkins.

> ⚠️ **Catatan penting — jangan jalankan `npm test` dalam mode fallback.**
> Suite E2E `tests/readme.spec.js` memvalidasi bahwa **URL live** GitSkins ada di
> README. Setelah `assets:swap`, README justru memakai path lokal, sehingga
> test "README memuat aset" akan gagal **by design** (bukan berarti ada bug).
> Untuk mengecek konektivitas API di mode ini, cukup jalankan `npm run assets`
> (mengunduh & memvalidasi tanpa menyentuh README).
> Kembalikan mode live dulu (`npm run assets:restore`) sebelum menjalankan `npm test`.

---

## 5. Langkah 3 — Diagnosa akar masalah

Dengan profil sudah aman (fallback aktif), sekarang cari tahu penyebabnya:

```bash
# 1. Unduh ulang semua aset — lihat mana yang error
npm run assets
```

Interpretasi hasil:
- Semua `✔` → API sudah pulih; kemungkinan kegagalan kemarin hanya gangguan sesaat.
  Lanjut ke **Langkah 4** (pulihkan live).
- Ada `✘` → aset tersebut yang bermasalah. Verifikasi langsung endpoint-nya:

```bash
# 2. Cek respons endpoint yang gagal (ganti dengan URL aset terkait)
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" \
  "https://www.gitskins.com/api/section/stats?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark"
```

- **HTTP 200 + `image/svg+xml`** → endpoint sehat; coba lagi nanti.
- **HTTP 4xx/5xx atau `text/html`** → endpoint berubah / sedang bermasalah.
  Buka URL-nya di browser untuk memastikan tampilannya (mungkin parameter baru
  seperti `v=`, `style=`, atau `mode=` yang dibutuhkan).

---

## 6. Langkah 4 — Perbaiki

### Kasus A: Parameter/URL endpoint berubah
1. Buka `scripts/gitskins.manifest.js` — **satu-satunya** sumber kebenaran URL.
2. Perbarui `url` aset yang gagal sesuai format baru yang berfungsi di browser.
3. Jalankan `npm run assets` → pastikan semua aset `✔`.
4. Update juga aset lokal: jalankan `npm run assets` sudah otomatis menimpa `./assets/*.svg`.

### Kasus B: API GitSkins down sementara
1. Tidak ada kode yang perlu diubah.
2. Biarkan profil dalam **mode fallback lokal** (Langkah 2) sampai API pulih.
3. Pantau: jalankan `npm run assets` setiap beberapa jam, atau cek status di
   https://www.gitskins.com.

### Kasus C: Aset lokal di repo kosong/korup (terdeteksi `validate_local_assets`)
1. Jalankan validasi untuk melihat aset mana yang bermasalah:
   ```bash
   node scripts/validate-assets.js
   ```
2. Hapus file yang korup lalu unduh ulang:
   ```bash
   rm -f assets/<nama-aset>.svg
   npm run assets
   ```
3. Jika GitSkins tidak bisa diunduh sama sekali, kembalikan SVG dari commit
   terakhir yang sehat:
   ```bash
   git checkout HEAD -- assets/<nama-aset>.svg
   ```
4. Commit perbaikan, lalu trigger ulang workflow — run sukses akan menutup issue
   otomatis.

---

## 7. Langkah 5 — Pulihkan mode live & validasi

Setelah yakin API / endpoint sudah normal:

```bash
# 1. Kembalikan README ke URL GitSkins live
npm run assets:restore

# 2. Validasi penuh: integritas README + fallback lokal + API (10 endpoint)
npm test

# 3. Commit & push
git add README.md assets/
git commit -m "fix(assets): pulihkan mode live GitSkins setelah pemulihan"
git push
```

> Jika `npm test` masih merah: jangan push restore. Kembalikan ke mode fallback
> (`npm run assets:swap`), commit, dan ulangi diagnosa (Langkah 3–4).

---

## 8. Langkah 6 — Validasi & tutup issue

1. **Trigger ulang workflow** secara manual: tab **Actions** → *Refresh GitSkins Assets*
   → **Run workflow** → jalankan dari branch `main`.
2. Jika run **sukses**, workflow sekarang otomatis:
   - menutup issue `⚠️ Widget GitSkins gagal dimuat` yang masih terbuka,
   - menambahkan komentar konfirmasi berisi tautan run yang sukses, dan
   - mengirim notifikasi **"run pulih"** ke Discord/Telegram (bila dikonfigurasi).
3. Jika run **masih gagal**, issue baru tidak akan dibuat (anti-duplikasi), issue lama
   tetap terbuka — kembali ke **Langkah 3**.
4. **Menutup manual** (jika perlu): tambahkan komentar ringkasan (penyebab + solusi)
   lalu klik **Close issue**. Tuliskan juga apa yang diperbaiki agar ada jejak
   audit untuk kejadian berikutnya.

---

## 9. Notifikasi eksternal: Discord & Telegram (opsional)

Workflow dapat mengirim notifikasi ke **Discord** dan/atau **Telegram** pada empat momen:

1. **🚨 Issue dibuat** — run gagal dan issue `⚠️ Widget GitSkins gagal dimuat` baru saja dibuat.
2. **✅ Run pulih** — run berikutnya sukses dan issue ditutup otomatis.
3. **⏱️ Run > 10 menit** — run selesai (sukses maupun gagal) tetapi berlangsung lebih dari 10 menit.
4. **⏰ Pengingat issue lama** — issue terbuka lebih dari 3 hari (workflow harian `remind-issue.yml`).

Workflow **mendeteksi otomatis** kanal mana yang terisi dan mengirim ke **semua**
kanal yang dikonfigurasi. Bila tidak ada kanal yang terisi, semua step notifikasi
**dilewati dengan aman** — tidak perlu mengubah kode apa pun.

Semua step notifikasi memakai satu composite action bersama,
`.github/actions/notify` — perbaikan payload cukup dilakukan di satu tempat.

### Discord

1. Buat webhook di server Discord: *Server Settings* → *Integrations* → *Webhooks* → *New Webhook*.
2. Tambahkan URL webhook sebagai secret repo **`DISCORD_WEBHOOK_URL`**:
   *Repo Settings* → *Secrets and variables* → *Actions* → *New repository secret*.

### Telegram

1. Buat bot via [@BotFather](https://t.me/BotFather) → `/newbot` → salin **bot token**.
2. Dapatkan **chat id** (bisa berupa angka, atau `@username` grup/kanal tempat bot diundang).
3. Tambahkan dua secret repo:
   - **`TELEGRAM_BOT_TOKEN`** — token dari BotFather.
   - **`TELEGRAM_CHAT_ID`** — chat id tujuan.

> ⚠️ Kedua secret Telegram harus terisi **bersamaan** — jika hanya salah satu yang
> diisi, kanal Telegram dianggap tidak dikonfigurasi dan dilewati.

---

## 10. Pengingat otomatis untuk issue lama

Selain alur darurat di atas, workflow harian **`remind-issue.yml`** (setiap hari
06:00 UTC) menjaga issue tidak terbengkalai:

1. Mencari issue terbuka berjudul `⚠️ Widget GitSkins gagal dimuat`.
2. Issue yang berumur **> 3 hari** dikomentari dengan pengingat berisi langkah
   perbaikan (anti-spam: diulang maksimal tiap 3 hari sampai issue ditutup).
3. Bila ada issue yang diingatkan, notifikasi Discord/Telegram ikut terkirim.

> Workflow pengingat **tidak** menutup issue — hanya mengingatkan. Issue tetap
> ditutup oleh `refresh-assets.yml` saat run berikutnya sukses, atau secara manual.

---

## 11. Referensi perintah cepat

| Situasi | Perintah |
| :--- | :--- |
| Unduh & optimasi aset lokal | `npm run assets` |
| **Darurat: alihkan README ke fallback lokal** | `npm run assets:swap` |
| Kembalikan README ke URL GitSkins live | `npm run assets:restore` |
| Validasi penuh (unduh + integritas lokal + API + README) | `npm test` |
| Cek integritas aset lokal saja (kosong/korup) | `node scripts/validate-assets.js` |
| Lint workflow GitHub Actions (actionlint) | `npm run lint` |
| Cek satu endpoint langsung | `curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" "<URL>"` |
| Bersihkan aset & kompres ulang | `npm run clean` |
| Sanitasi riwayat git (jika ada file sensitif) | `npm run sanitize` |

**Urutan darurat yang aman (hafalkan):**
```
npm run assets:swap  →  git add README.md  →  git commit  →  git push
```

---

## 12. Pencegahan (agar jarang terjadi)

1. **Jangan ubah URL aset langsung di README** — selalu lewat
   `scripts/gitskins.manifest.js`, lalu `npm run assets`.
2. **Rutin refresh aset lokal** — workflow mingguan (Senin 03:00 UTC) sudah
   melakukannya; pastikan tidak ada run yang dibiarkan gagal.
3. **Jaga `assets/` selalu ter-update** agar fallback lokal benar-benar
   "anti-kadaluarsa" saat darurat.
4. **Jika GitSkins berubah kontrak API-nya**, perbarui manifest di hari yang sama
   agar fallback lokal ikut memakai format baru.
5. **Catat kejadian** (tanggal, penyebab, solusi) di issue yang ditutup — ini jadi
   basis data insiden untuk diagnosis berikutnya.

---

*Dokumen ini dikelola bersama workflow otomatis di `.github/workflows/refresh-assets.yml`.
Bila alur otomatisasi diubah, perbarui juga dokumen ini.*
