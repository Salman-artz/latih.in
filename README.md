# latih.in — Website Tryout Online Mandiri

> **Belajar dari video, latihan lewat tryout.**  
> Proyek Technical Test Full Stack Developer — PT Lini Suara Nusantara (Penerbit Buku Liniswara).  
> **Target Pengumpulan:** Rabu, 25 November 2026 pukul 15.00 WIB.

---

## 🔗 Tautan & Akun Demo

- **URL Demo Production:** [Menunggu deploy Vercel - lihat bagian Deployment di bawah](#-deployment)
- **Repositori GitHub:** [https://github.com/Salman-artz/latih.in](https://github.com/Salman-artz/latih.in)

### 🔑 Akun Demo (Disediakan via Seed Database)

| Peran | Alamat Email | Password | Keterangan |
|---|---|---|---|
| **Administrator** | `admin@demo.test` | `Demo#12345` | Akses penuh `/admin`, statistik, kelola kode, kelola materi |
| **Siswa (User)** | `user@demo.test` | `Demo#12345` | Akun baru tanpa langganan aktif (materi & tryout terkunci) |

### 🎟️ Kode Redeem Demo (30 Hari Masa Aktif)

Reviewer dapat menukarkan kode-kode berikut di halaman `/redeem`:
1. `LATIH-DEMO-0001`
2. `LATIH-DEMO-0002`
3. `LATIH-DEMO-0003`
4. `LATIH-DEMO-0004`
5. `LATIH-DEMO-0005`

*(Input fleksibel: huruf kecil/besar, dengan atau tanpa tanda hubung `-` akan dinormalisasi secara otomatis)*.

---

## 📋 Status Fitur

### ✅ Selesai Dikerjakan (P0 & P1)

#### 🌟 Prioritas P0 (Fitur Wajib Soal)
- [x] **Autentikasi & Akun:** Registrasi akun baru, login, logout, sesi JWT berbasis cookie `httpOnly`, `SameSite=Lax`, `Secure` (di production), dengan masa aktif 7 hari. Validasi input nama, email unik, dan password kuat (min 8 karakter kombinasi huruf & angka).
- [x] **Rate Limiting Database-Backed:** Pembatasan 10 request per menit per IP untuk login, register, dan redeem menggunakan tabel PostgreSQL `RateLimit` (kompatibel serverless).
- [x] **Aktivasi Langganan via Kode Redeem:** Normalisasi kode, transaksi atomik database (`prisma.$transaction` dengan `updateMany` bersyarat), pesan error spesifik (*invalid*, *already used*, *expired*, *revoked*), dan perpanjangan masa aktif kumulatif bagi pengguna yang sudah berlangganan aktif.
- [x] **Guard Hak Akses Server-Side:** Seluruh validasi sesi, status aktif user, dan masa aktif langganan diverifikasi di sisi server (API route handler & Server Components), bukan sekadar disembunyikan di UI.
- [x] **Materi Belajar Video:** Kurikulum video edukasi berbasis embed YouTube nocookie responsif (16:9). Pengguna tanpa langganan diarahkan ke halaman aktivasi redeem.
- [x] **Simulasi Tryout & Skoring:** 1 paket tryout, 10 stimulus soal, masing-masing memuat tepat 3 butir pernyataan (total 30 butir Benar/Salah). Jawaban tersimpan otomatis berkala (*debounce autosave*). Skoring transparan di server: 1 poin per butir benar, skala nilai 0–100 (1 desimal).
- [x] **Keamanan Kunci Jawaban:** Payload soal saat pengerjaan (`IN_PROGRESS`) secara mutlak tidak mengirimkan `isTrue` dan `explanation` ke peramban. Kunci dan pembahasan hanya dikirim setelah attempt disubmit.
- [x] **Landing Page:** Satu halaman responsif (360px ke atas) mencakup Navbar dengan anchor, Hero section, Fitur unggulan, Cara kerja 4 langkah, Cuplikan materi, FAQ, dan Footer.
- [x] **Seed Data Idempotent:** Pembuatan akun admin & user demo, 5 kode redeem, 5 modul materi video, serta 10 soal tryout (30 butir pernyataan) yang tervalidasi lengkap dengan kunci dan pembahasan.

#### 🚀 Prioritas P1 (Nilai Tambah Berbiaya Kecil)
- [x] **Timer Tryout 20 Menit:** Hitung mundur tersinkronisasi dari `startedAt` server. Refresh peramban tidak mereset waktu. Auto-submit saat waktu habis.
- [x] **Riwayat Attempt Siswa:** Daftar seluruh sesi tryout yang pernah diselesaikan lengkap dengan skor, persentase nilai, dan waktu pengerjaan.
- [x] **Penanda Progres Belajar:** Tombol "Tandai Selesai" pada materi video yang menyimpan progres per user dan indikator bar progres modul di dashboard dan daftar materi.
- [x] **Banner Peringatan Masa Aktif:** Notifikasi otomatis di dashboard saat sisa masa aktif langganan $\le 7$ hari.
- [x] **Ganti Password:** Pengaturan kata sandi baru di halaman profil siswa.
- [x] **Panel Admin — Dashboard Statistik:** Menampilkan metrik total pengguna, user baru 7 hari, langganan aktif, langganan segera berakhir, kode tersedia/terpakai, dan rata-rata skor tryout.
- [x] **Panel Admin — Kelola Kode Redeem:** Pembuatan kode massal (batch 1–100 kode, 12 karakter acak tanpa karakter ambigu `0, O, 1, I`), tabel paginasi 20 baris dengan pencarian & filter status, pencabutan kode yang belum terpakai, serta ekspor data ke file CSV.
- [x] **Panel Admin — Kelola Materi Video:** Penambahan materi baru dengan validasi tautan YouTube dan ekstraksi video ID otomatis, pengubahan konten, serta pengarsipan materi (*soft archive* ke status `DRAFT` bila sudah memiliki riwayat tonton user).

### ⏸️ Sengaja Ditunda (P2 — Sesuai Batasan Soal)
- [ ] Pengelolaan profil pengguna secara manual oleh admin (aktivasi/deaktivasi manual).
- [ ] CMS pembuat soal tryout dinamis dari UI admin (saat ini konten seed sudah sangat komprehensif untuk pengujian).
- [ ] Payment gateway online & transfer bank (di luar kebutuhan spesifikasi kode redeem).

---

## 🎯 Prioritas Pengerjaan & Alasannya

Mengacu pada prinsip rekayasa perangkat lunak dengan tenggat waktu terbatas (technical test):
1. **P0 (Kebutuhan Wajib Soal):** Memastikan seluruh alur inti berjalan utuh tanpa celah: *Daftar $\rightarrow$ Login $\rightarrow$ Redeem Kode $\rightarrow$ Nonton Materi $\rightarrow$ Tryout $\rightarrow$ Penilaian & Pembahasan*. Kualitas keamanan (anti-bocor kunci jawaban, integritas transaksi redeem, dan otorisasi server) adalah syarat mutlak yang tidak boleh dikompromikan.
2. **P1 (Nilai Tambah Esensial):** Fitur seperti timer tryout, autosave, riwayat nilai, dan panel admin kode/materi memberikan pengalaman produk nyata (*production-ready feel*) dengan kompleksitas yang terukur.
3. **P2 (Dieliminasi):** Fitur CMS bank soal atau payment gateway sengaja tidak dikerjakan agar tidak menghabiskan waktu pada hal sekunder di luar kriteria penilaian utama.

---

## 🛠️ Tech Stack & Keputusan Teknis

- **Framework:** Next.js 15 (App Router) — Monolit Fullstack dengan **Clean Architecture**.
  - *Alasan:* Menghilangkan *overhead* konfigurasi CORS lintas domain, menyatukan definisi tipe data dan skema validasi Zod antara frontend dan backend, serta memudahkan deployment satu atap di Vercel.
- **Pola Arsitektur (Clean Architecture):**
  - **Domain Layer (`src/core/domain/`):** Entitas bisnis murni (`UserEntity`, `SubscriptionEntity`, `TryoutEntity`, dll.) dan abstraksi antarmuka repositori (*repository ports*) yang bebas ketergantungan dari framework eksternal.
  - **Use Cases Layer (`src/core/use-cases/`):** Aturan bisnis aplikasi dengan prinsip *Single Responsibility* (Auth, Redeem, Subscription, Materials, Tryout, Admin).
  - **Infrastructure Layer (`src/infrastructure/`):** Implementasi repositori berbasis Prisma ORM, adapter keamanan JWT (`JoseTokenService`), dan adapter hash password (`BcryptPasswordHasher`).
  - **Dependency Injection Container (`src/core/container.ts`):** Komposisi sentral (*composition root*) yang menginstansiasi repositori dan use case secara terisolasi dan mudah di-mock pada saat pengujian.
  - **Presentation Layer (`src/app/` & `src/components/`):** Route Handler API tipis dan React Server Components yang mendelegasikan eksekusi langsung ke use case.
- **Bahasa:** TypeScript (Strict Mode).
- **Database & ORM:** PostgreSQL + Prisma ORM.
- **Autentikasi & Kriptografi:** `jose` (JWT) + `bcryptjs` (Cost 10).
- **Styling & Desain:** Tailwind CSS murni dengan palet warna resmi (`brand-navy: #001031`, `brand-blue: #0048FC`, `brand-blue-50: #EAF0FF`, `surface: #FFFFFF`) dan font Google (Poppins untuk heading, Inter untuk body).
- **Validasi Data:** Zod pada client-side dan server-side route handler.
- **Ikon Antarmuka:** `lucide-react`.
- **Pengujian Unit:** Vitest (pengujian logika skoring, validasi, dan konkurensi redeem).

### Keputusan Teknis Kritis
1. **Redeem Atomik Bebas Race Condition:**  
   Penebusan kode dilakukan dalam satu blok `prisma.$transaction` menggunakan klausa update bersyarat:
   ```ts
   prisma.redeemCode.updateMany({
     where: { code, isUsed: false, revokedAt: null, ... },
     data: { isUsed: true, usedById: userId, usedAt: now }
   })
   ```
   Bila baris yang terpengaruh bukan 1, transaksi dibatalkan dan sistem meneliti apakah kode salah, kedaluwarsa, atau sudah pernah dipakai. Hal ini terbukti lulus pada uji konkurensi paralel.
2. **Kerahasiaan Kunci Jawaban:**  
   Saat siswa membuka halaman ujian (`/tryout/[attemptId]`), query database menggunakan klausa `select` eksplisit yang memangkas kolom `isTrue` dan `explanation`. Inspeksi lewat *Network tab* peramban tidak akan pernah menemukan kunci jawaban sebelum tombol Submit ditekan.
3. **Skoring Proporsional:**  
   Setiap butir pernyataan yang dijawab sesuai dengan fakta stimulus bernilai 1 poin (total maksimal 30 poin). Nilai persentase dihitung dengan rumus:
   $$\text{Persentase} = \left(\frac{\text{Poin Benar}}{30}\right) \times 100\%$$
   Butir yang dikosongkan tidak mendapat penalti minus (dihitung 0).

---

## 🚀 Panduan Deployment ke Vercel

Aplikasi dirancang agar sepenuhnya *stateless* dan siap di-deploy ke Vercel dengan database PostgreSQL (Sumopod / Neon):

### 1. Import Proyek di Vercel
1. Buka dashboard [Vercel](https://vercel.com) lalu klik **Add New...** $\rightarrow$ **Project**.
2. Pilih repositori GitHub: `https://github.com/Salman-artz/latih.in`.
3. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.

### 2. Konfigurasi Environment Variables di Vercel
Tambahkan variabel lingkungan berikut di tab **Environment Variables**:

| Variable | Nilai Rekomendasi / Produksi | Deskripsi |
|---|---|---|
| `DATABASE_URL` | `postgresql://uUy6v6HC2deVSK42U.jkt1_005:45317da5946f08aaa7b1b817@pgsql-dbas-jkt1-005.sumobase.my.id:6432/dbe8554b6bfc629c8f?schema=latih_in&pgbouncer=true` | Koneksi PostgreSQL Sumopod dengan schema khusus `latih_in` & flag PgBouncer |
| `JWT_SECRET` | `latih-in-super-secure-jwt-secret-key-production-ready-min-48-chars-long-2026` | Kunci rahasia HS256 untuk penandatanganan token JWT sesi cookie |
| `APP_URL` | `https://latih-in.vercel.app` *(sesuaikan dengan domain Vercel kamu)* | URL domain publik aplikasi |
| `NODE_ENV` | `production` | Mode produksi |

> [!NOTE]
> Database Sumopod pada host `pgsql-dbas-jkt1-005.sumobase.my.id:6432` menggunakan schema `latih_in` yang **telah dimigrasi dan di-seed data lengkap** (akun admin, user demo, 5 kode redeem, 5 modul materi video, dan paket tryout 10 soal/30 butir). Setelah deploy di Vercel, aplikasi langsung dapat diuji coba tanpa perlu menjalankan seed ulang.

### 3. Deploy
1. Klik tombol **Deploy**.
2. Vercel akan menjalankan `prisma generate && next build` dan menyajikan aplikasi secara global.
3. Setelah deployment selesai, salin URL Vercel dan perbarui `APP_URL`.

---

## 🐳 Docker & CI/CD GitHub Actions

### 1. Menjalankan via Docker Compose (Lokal)
Aplikasi telah dilengkapi dengan konfigurasi multi-stage build `Dockerfile` (Next.js 15 Standalone) dan `docker-compose.yml` yang mencakup service PostgreSQL mandiri:

```powershell
# Menjalankan aplikasi dan database PostgreSQL lokal via Docker
docker compose up --build -d

# Memeriksa log aplikasi
docker compose logs -f app
```
Aplikasi dapat diakses di `http://localhost:3000`.

### 2. CI/CD GitHub Actions Pipeline
Setiap *push* atau *pull request* ke branch `main` secara otomatis memicu workflow `.github/workflows/ci.yml` yang menjalankan:
1. **Code Quality & Typecheck:** Validasi `npx tsc --noEmit` & `eslint`.
2. **Automated Unit & Integration Test:** Eksekusi Vitest (skoring, validasi, dan konkurensi database).
3. **Docker Build & Smoke Test:** Pembangunan image Docker menggunakan Docker Buildx dengan layer caching GitHub Actions (`gha`) untuk menjamin image production selalu valid dan bebas broken build.

---

## 💻 Panduan Menjalankan di Komputer Lokal
- Node.js versi 20 ke atas (`node -v`)
- PostgreSQL terpasang lokal (port 5432)
- Git dan PowerShell (Windows)

### Langkah Pemasangan (PowerShell)

1. **Buka folder proyek:**
   ```powershell
   cd "D:\Project Porto\latih.in"
   ```

2. **Siapkan Environment Variable:**
   Salin berkas `.env.example` menjadi `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   Pastikan isi `.env` sesuai dengan konfigurasi lokal:
   ```env
   DATABASE_URL="postgresql://postgres:password_kamu@localhost:5432/latih_in?schema=public"
   JWT_SECRET="latih-in-super-secure-jwt-secret-key-production-ready-min-48-chars-long-2026"
   APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

3. **Install Dependensi:**
   ```powershell
   npm install
   ```

4. **Jalankan Migrasi Database:**
   ```powershell
   npx prisma migrate dev --name init
   ```

5. **Lakukan Seeding Data Awal:**
   ```powershell
   npm run db:seed
   ```

6. **Jalankan Unit Test:**
   ```powershell
   npm test
   ```

7. **Jalankan Server Development:**
   ```powershell
   npm run dev
   ```
   Aplikasi dapat diakses melalui peramban di `http://localhost:3000`.

---

## 📁 Struktur Direktori (Clean Architecture)

```text
latih.in/
├── prisma/
│   ├── schema.prisma            # Skema PostgreSQL (11 Model, Relasi, Indeks)
│   ├── seed.ts                  # Script seeding data demo (idempotent)
│   └── seed-data/               # Modul materi & paket tryout demo
├── public/                      # Aset statis & logo wordmark resmi
├── src/
│   ├── core/                    # INTI BISNIS (Clean Architecture)
│   │   ├── domain/
│   │   │   ├── entities/        # Entitas domain (User, Subscription, Tryout, dll.)
│   │   │   └── repositories/    # Interfaces / Ports Repositori
│   │   ├── use-cases/           # Application Use Cases (Auth, Redeem, Tryout, Admin)
│   │   └── container.ts         # Dependency Injection / Composition Root
│   ├── infrastructure/          # ADAPTER & IMPLEMENTASI EKSTERNAL
│   │   ├── repositories/        # Implementasi Repositori Prisma ORM
│   │   └── security/            # Jose JWT Service & Bcrypt Hasher Service
│   ├── app/                     # PRESENTATION LAYER (Next.js 15 App Router)
│   │   ├── (public)/            # Landing page (/), /login, /register
│   │   ├── (app)/               # /dashboard, /redeem, /materi, /tryout, /riwayat, /profil
│   │   ├── (admin)/admin/       # /admin (Statistik), /admin/kode, /admin/materi
│   │   └── api/                 # 17 Route Handler tipis yang memanggil Use Cases
│   ├── components/              # Komponen UI Reusable (Navbar, Footer, Tryout, Video)
│   ├── lib/                     # Utilitas singleton db, errors, & validator Zod
│   ├── middleware.ts            # Proteksi rute & verifikasi token JWT
│   └── tests/                   # Pengujian Vitest & script checklist verifikasi
├── vitest.config.ts             # Konfigurasi runner Vitest
├── tailwind.config.ts           # Konfigurasi tema & token warna brand
└── package.json
```

---

## 🤖 Catatan Penggunaan AI Assistant

Sesuai komitmen kejujuran akademis dan profesional:
- Proyek ini dikembangkan secara kolaboratif menggunakan AI Assistant (**Antigravity**) untuk *scaffolding* komponen antarmuka, pembuatan bank soal literasi penalaran, serta penyusunan script migrasi data.
- Seluruh arsitektur keamanan, pola transaksi atomik database, penegakan hak akses server-side, perhitungan skoring, serta pengujian logika telah dikaji dan diverifikasi langsung oleh engineer agar memenuhi standar pengujian teknis PT Lini Suara Nusantara.
