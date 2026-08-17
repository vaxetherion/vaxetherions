<!-- ============================================================
  README.md — GitHub Profile | Aetherion (@vaxetherion)
  ------------------------------------------------------------
  Tema      : Hybrid Dashboard Professional (Cyberpunk + Terminal)
  Aset      : GitSkins API (live) + fallback lokal di ./assets/
  Pipeline  : npm run assets          → unduh & optimasi aset lokal
              npm run assets:swap     → alihkan README ke aset lokal
              npm run assets:restore  → kembalikan ke URL GitSkins
              npm run lint            → lint workflow GitHub Actions (actionlint)
              npm test                → unduh aset + validasi integritas lokal + lint + E2E (API & fallback)
              CI mingguan             → .github/workflows/refresh-assets.yml
              Playbook darurat        → docs/playbook-darurat.md
  Keamanan  : Lihat SECURITY.md untuk analisis celah & penambalan.
============================================================ -->

<div align="center">
  <img src="https://www.gitskins.com/api/readme-reference/hero?username=vaxetherion&theme=neon" alt="Hero Neon Aetherion" width="860" />
  <br />
  <a href="https://github.com/vaxetherion/vaxetherion/actions/workflows/refresh-assets.yml" rel="noopener noreferrer">
    <img src="https://github.com/vaxetherion/vaxetherion/actions/workflows/refresh-assets.yml/badge.svg" alt="Status Workflow: Refresh GitSkins Assets" />
  </a>
  <a href="https://github.com/vaxetherion/vaxetherion/actions/workflows/remind-issue.yml" rel="noopener noreferrer">
    <img src="https://github.com/vaxetherion/vaxetherion/actions/workflows/remind-issue.yml/badge.svg" alt="Status Workflow: Remind Open GitSkins Issue" />
  </a>
</div>

<div align="center">
  <img src="https://www.gitskins.com/api/section/portrait?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark" alt="Portrait ASCII Aetherion" width="200" />
  <br />
  <img src="https://www.gitskins.com/api/section/wordmark?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark" alt="Wordmark Aetherion — Terminal Style" width="720" />
</div>

<div align="center">

```
┌──────────────────────────────────────────────────────┐
│  AETHERION :: ASPIRING FULL-STACK DEVELOPER          │
│  "Setiap baris kode hari ini, fondasi sistem besok." │
└──────────────────────────────────────────────────────┘
```

**Selamat datang di terminal-ku** — dibangun baris demi baris, commit demi commit.

</div>

---

## 🩺 Status & Otomasi

Profil ini dijaga otomatis oleh tiga komponen yang saling melengkapi:

| Komponen | Jadwal | Tugas utama |
| :--- | :--- | :--- |
| **`refresh-assets.yml`** | Mingguan (Senin 03:00 UTC) + manual + saat `scripts/` berubah | Unduh & optimasi aset GitSkins, validasi E2E (API + fallback lokal), commit aset baru, buka/tutup issue otomatis, label `bug` + `automation`, assign, notifikasi, & peringatan durasi run > 10 menit |
| **`remind-issue.yml`** | Harian (06:00 UTC) | Pengingat otomatis bila issue *⚠️ Widget GitSkins gagal dimuat* terbuka > 3 hari |
| **`notify`** (composite action) | Dipanggil kedua workflow di atas | Kirim notifikasi ke **Discord** dan/atau **Telegram** sesuai secret yang terisi |

> 🚨 Terjadi insiden? Ikuti panduan darurat langkah demi langkah di
> [docs/playbook-darurat.md](docs/playbook-darurat.md) — termasuk cara rollback
> ke fallback lokal (`npm run assets:swap`) dan pemulihan mode live.

---

## 📜 Changelog Otomasi

Evolusi otomasi profil dicatat di sini agar setiap perubahan bisa ditelusuri.

### v1.1.0 — 18 Agustus 2026

- **Pemicu issue lebih luas**: deteksi aset fallback lokal kosong/korup
  (`scripts/validate-assets.js`, step `validate_local_assets`) — issue kini
  terbuka bukan hanya saat API GitSkins gagal.
- **Siklus hidup issue otomatis penuh**: komentar diagnosa awal (step mana yang
  gagal), label `bug` + `automation`, assign ke pemilik repo, dan **auto-close**
  pada run berikutnya yang sukses.
- **Notifikasi eksternal**: composite action `.github/actions/notify` — Discord
  dan/atau Telegram (deteksi otomatis secret terisi) untuk momen: issue dibuat,
  run pulih, run > 10 menit, dan pengingat issue lama.
- **Pengingat harian** (`remind-issue.yml`): issue terbuka > 3 hari diingatkan
  otomatis tiap 3 hari hingga ditutup.
- **Validasi PR** (`pr-validation.yml`): lint actionlint + suite tes penuh
  sebelum merge.
- **Kualitas**: `npm test` kini mencakup validasi integritas aset lokal **dan
  lint actionlint** (`npm run lint`); unit test baru untuk `validate-assets.js`;
  badge status workflow; bagian Status & Otomasi; playbook darurat
  (`docs/playbook-darurat.md`); skrip branch protection
  (`scripts/enable-branch-protection.sh`).

### v1.0.0 — Baseline

- Workflow mingguan `refresh-assets.yml`: unduh & optimasi aset GitSkins,
  validasi E2E (API + fallback lokal), commit aset baru, dan pembukaan issue
  otomatis bila widget gagal dimuat.

---

## 🚀 Tentang Saya

> "Meskipun langkah awal terasa ambisius bagi seorang pemula, tekadku sudah bulat untuk menjadi Full-Stack Developer Profesional yang tangguh."

Halo! Saya **Aetherion** — seorang developer pemula yang sedang menapaki jalan panjang menuju **Full-Stack Developer Profesional**. Perjalanan ini kubangun di atas kejujuran, konsistensi, dan proyek nyata — bukan sekadar teori.

> "Jika informasi tidak pasti atau kamu tidak tahu, katakan 'Saya tidak tahu', jangan menebak."

| 👨‍💻 Identity | 🎯 Misi Utama | 💡 Filosofi Belajar |
| :--- | :--- | :--- |
| **Aetherion** (`vaxetherion`) | Menguasai arsitektur **Frontend, Backend, Database, hingga Security & DevOps** | Berani mencoba, pahami dasar, tingkatkan keahlian melalui proyek nyata secara konsisten |

---

## 🛠️ Tech Stack & Ekosistem

<p align="center">
  <img src="https://www.gitskins.com/api/section/stack?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark" alt="Tech Stack Aetherion" width="680" loading="lazy" />
</p>

---

## 📊 Aktivitas & Statistik GitHub

<p align="center">
  <img src="https://www.gitskins.com/api/section/stats?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark" alt="Statistik GitHub Aetherion" width="680" loading="lazy" />
</p>

<p align="center">
  <img src="https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=aurora&v=profile-preview-2&style=terminal&mode=dark" alt="Heatmap Kontribusi — Aurora" width="680" loading="lazy" />
  <br />
  <img src="https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark" alt="Heatmap Kontribusi — GitHub Dark" width="680" loading="lazy" />
</p>

---

## 📂 Proyek & Mode Kompetitif

<p align="center">
  <img src="https://www.gitskins.com/api/section/projects?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark" alt="Proyek Aetherion" width="680" loading="lazy" />
</p>

<p align="center">
  <img src="https://www.gitskins.com/api/readme-reference/competitive?username=vaxetherion&theme=github-dark&v=competitive-layout-2" alt="Mode Kompetitif Aetherion" width="620" loading="lazy" />
</p>

---

## 🔮 Terus Bertumbuh

<p align="center">
  <img src="https://www.gitskins.com/api/section/hero?username=vaxetherion&theme=neon&v=profile-preview-2&mode=dark" alt="Hero Dark — Penutup Aetherion" width="680" loading="lazy" />
</p>

---

<div align="center">
  <sub>Dibangun dengan tekad & kopi oleh <a href="https://github.com/vaxetherion" rel="noopener noreferrer">Aetherion</a> · Aset visual: <a href="https://www.gitskins.com" rel="noopener noreferrer">GitSkins</a> · <a href="docs/playbook-darurat.md" rel="noopener noreferrer">Playbook darurat</a> · <a href="docs/setup-repo.md" rel="noopener noreferrer">Setup repo</a></sub>
</div>
# vaxetherions
