# latih.in — Website Tryout Online Mandiri

> **Belajar dari video, latihan lewat tryout.**  
> Proyek Technical Test Full Stack Developer — PT Lini Suara Nusantara (Penerbit Buku Liniswara).  
> **Target Pengumpulan:** Rabu, 25 November 2026 pukul 15.00 WIB.

---

## 🔗 Tautan & Akun Demo

- **URL Demo Production:** [Menunggu deploy Vercel - lihat bagian Deployment di bawah](#-deployment)
- **Repositori GitHub:** [Menunggu remote push - lihat bagian Deployment di bawah](#-deployment)

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

- **Framework:** Next.js 15 (App Router) — Monolit Fullstack.
  - *Alasan:* Menghilangkan *overhead* konfigurasi CORS lintas domain, menyatukan definisi tipe data dan skema validasi Zod antara frontend dan backend, serta memudahkan deployment satu atap di Vercel.
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

## 💻 Panduan Menjalankan di Komputer Lokal

### Prasyarat
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

## 📁 Struktur Direktori

```text
latih.in/
├── prisma/
│   ├── schema.prisma            # Skema PostgreSQL (11 Model, Relasi, Indeks)
│   ├── seed.ts                  # Script seeding data demo (idempotent)
│   └── seed-data/
│       ├── materials.ts         # Data kurikulum 5 video pembelajaran
│       └── tryouts.ts           # 10 Soal stimulus, 30 pernyataan, kunci & pembahasan
├── public/
│   └── brand/                   # Aset logo wordmark resmi latih.in
├── src/
│   ├── app/
│   │   ├── (public)/            # Landing page (/), /login, /register
│   │   ├── (app)/               # /dashboard, /redeem, /materi, /tryout, /riwayat, /profil
│   │   ├── (admin)/admin/       # /admin (Statistik), /admin/kode, /admin/materi
│   │   ├── api/                 # 17 Endpoint API (Auth, Me, Redeem, Materi, Tryout, Admin)
│   │   ├── layout.tsx           # Root layout dengan font Poppins & Inter
│   │   └── icon.svg             # Favicon huruf 'l' navy + dot biru
│   ├── components/
│   │   ├── layout/              # Navbar responsif & Footer
│   │   ├── ui/                  # Logo fallback, Banner langganan
│   │   ├── materi/              # Toggle tombol status materi selesai
│   │   └── tryout/              # Komponen tombol start & ujian tryout
│   ├── lib/
│   │   ├── auth.ts              # Enkripsi JWT jose, cookie session httpOnly
│   │   ├── db.ts                # Prisma Client Singleton
│   │   ├── errors.ts            # AppError & formatter response JSON seragam
│   │   ├── rate-limit.ts        # Database-backed rate limiter
│   │   └── validators/          # Skema validasi Zod (Auth, Redeem, Tryout, Admin)
│   ├── middleware.ts            # Proteksi rute & verifikasi token JWT
│   ├── services/                # Logika bisnis (Auth, Redeem, Materi, Tryout, Admin)
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
