# Security Analysis & Patch — Profil GitHub Aetherion

Dokumen ini merangkum analisis celah keamanan pada integrasi aset eksternal
(GitSkins API / SVG) beserta langkah penambalan yang telah diterapkan di
repositori ini.

---

## 1. Celah: SVG Embedded Script Injection (XSS)

**Analisis** — Berkas SVG adalah dokumen XML yang secara teknis dapat memuat
tag `<script>`, atribut event handler (`onload`, `onerror`, `onclick`), elemen
`<foreignObject>`, atau URL `javascript:`. Jika endpoint GitSkins dikompromikan
atau menyajikan konten jahat, SVG tersebut berpotensi menjadi vektor serangan.

**Fakta mitigasi bawaan (tanpa kode tambahan)**:
- SVG yang dimuat melalui tag `<img>` **tidak pernah mengeksekusi script**.
  Browser mengisolasi gambar sebagai *passive content*; `<script>` di dalam SVG
  hanya berjalan saat dibuka langsung atau dimuat via `<object>`/`<iframe>`.
- GitHub merender seluruh gambar eksternal melalui proxy
  `camo.githubusercontent.com` yang menolak tipe konten non-gambar dan
  menghapus konteks halaman asal.

**Penambalan berlapis (defense in depth) yang diterapkan**:
1. `scripts/download-assets.js` menjalankan sanitasi SVG sebelum menyimpan
   fallback lokal: membuang blok `<script>`, atribut `on*`, URL `javascript:`,
   dan elemen `<foreignObject>`.
2. Optimasi lanjutan dengan `svgo` (multipass) yang membuang metadata,
   komentar, dan atribut tak terpakai.
3. Suite E2E (`tests/readme.spec.js`) menguji bahwa setiap aset lokal **tidak
   mengandung** pola `<script`, `on*=` , atau `javascript:`.

> **Catatan kejujuran**: Sanitasi pada downloader bersifat berbasis-pola
> (regex), bukan parser XML penuh. Ini cukup karena berkas hanya disajikan
> sebagai gambar `<img>` (script tidak dapat dieksekusi), tetapi bukan
> pengganti audit manual jika kebijakan upstream GitSkins berubah.

## 2. Celah: Broken Image Link / API Downtime

**Analisis** — Profil yang sepenuhnya bergantung pada API pihak ketiga akan
menampilkan gambar rusak jika endpoint down, berubah skema, atau menolak
parameter tertentu.

**Penambalan yang diterapkan**:
- Seluruh 10 aset diunduh ke `./assets/` sebagai cadangan lokal yang
  dikomit ke repositori (abadi selama repo ada).
- `npm run assets:swap` mengganti seluruh URL GitSkins di `README.md` dengan
  path lokal `./assets/*.svg`, sehingga profil tetap utuh saat API offline.
- `npm run assets:restore` mengembalikan README ke URL live.
- Suite E2E memverifikasi HTTP 200 dan keberadaan file fallback lokal.
- CI mingguan (`.github/workflows/refresh-assets.yml`) menjalankan unduhan + E2E,
  meng-commit aset terbaru, dan membuka issue otomatis bila ada widget yang gagal
  dimuat — sehingga degradasi API terdeteksi tanpa pemantauan manual.

## 3. Celah: Referrer Leakage & Tracking

**Analisis** — Request gambar langsung dapat membocorkan header `Referer`
berisi URL halaman profil ke server pihak ketiga.

**Penambalan yang diterapkan**:
- Semua gambar dirender melalui tag `<img>` polos — GitHub otomatis
  memproksikan via `camo.githubusercontent.com`, sehingga server GitSkins
  tidak menerima header `Referer` halaman asal.
- Tautan eksternal yang dibungkus anchor memakai `rel="noopener noreferrer"`
  agar tidak membocorkan referrer maupun membuka konteks window baru.

## 4. Celah: Rate Limiting & Politeness

**Analisis** — Unduhan massal atau polling agresif ke endpoint publik dapat
memicu pembatasan (rate limit) atau pemblokiran IP.

**Penambalan yang diterapkan**:
- `scripts/download-assets.js` mengunduh secara **sekuensial** dengan jeda
  250 ms antar-request dan timeout 20 detik per request.
- Tidak ada token/API key yang disisipkan di URL (hanya parameter publik
  `username`, `theme`, `style`, `mode`).

## 5. Celah: Eksposur Identitas & Email Harvesting

**Analisis** — Menampilkan email pribadi di README atau profil publik
memudahkan spam dan email harvesting oleh bot.

**Penambalan yang diterapkan**:
- `README.md` **tidak** menampilkan alamat email apa pun.
- Identitas `roufprivate@gmail.com` hanya digunakan pada konfigurasi Git
  lokal (`scripts/git-sanitize.sh`).

> **Rekomendasi auditor**: Untuk aktivitas publik yang panjang, pertimbangkan
> mengganti email git dengan alamat *noreply* GitHub
> `283149106+vaxetherion@users.noreply.github.com` (format
> `<user-id>+<username>@users.noreply.github.com`) agar alamat pribadi tidak
> tercatat permanen di riwayat commit publik.

## 6. Kontrol Repo: Branch Protection untuk main

**Analisis** — Tanpa proteksi, perubahan workflow/scripts dapat langsung masuk
ke `main` tanpa validasi apa pun, termasuk perubahan yang berpotensi merusak
pipeline otomasi profil (refresh aset, siklus hidup issue, notifikasi).

**Penambalan yang diterapkan**:
- Workflow `pr-validation.yml` — lint actionlint untuk seluruh workflow +
  composite action, lalu suite tes penuh (`npm test`) pada setiap pull request.
- `npm run lint` juga menjadi bagian dari `npm test` lokal
  (`scripts/lint-workflows.sh`; binary actionlint diunduh otomatis ke cache
  proyek), sehingga masalah YAML/ekspresi terdeteksi sebelum push.

**Disarankan (belum aktif karena repo belum live di GitHub)**:
- Aturan branch protection untuk `main`: status check **PR Validation** wajib
  lolos dan branch harus up-to-date sebelum merge.
- Terapkan lewat skrip `scripts/enable-branch-protection.sh` (via `gh api`)
  setelah repo di-push, atau manual melalui *Settings → Branches*.

## 7. Pernyataan Kejujuran

- **Status/SLA resmi GitSkins**: Informasi tersebut tidak tersedia; analisis
  di atas berdasarkan perilaku HTTP yang terukur pada saat audit (semua 10
  endpoint mengembalikan HTTP 200 dengan `Content-Type: image/svg+xml`).
- **Keamanan absolut tidak dijamin oleh siapa pun**: pertahanan berlapis
  mengurangi risiko, tidak menghilangkannya.
