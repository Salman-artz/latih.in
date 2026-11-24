# latih.in — Platform Latihan Soal dan Tryout Online Mandiri

> Belajar dari video, latihan lewat tryout.  
> Proyek Technical Test Full Stack Developer — PT Lini Suara Nusantara (Penerbit Buku Liniswara).  
> Target Pengumpulan: Rabu, 25 November 2026 pukul 15.00 WIB.

---

## 1. Tautan Publik dan Kredensial Pengujian

- URL Produksi Utama: [https://latihin.salmanartzdev.my.id](https://latihin.salmanartzdev.my.id)
- URL Alternatif Vercel: [https://latih-in.vercel.app](https://latih-in.vercel.app)
- Repositori GitHub: [https://github.com/Salman-artz/latih.in](https://github.com/Salman-artz/latih.in)

### Akun Pengujian Demo (Tersedia via Database Seed)

| Peran | Alamat Email | Kata Sandi | Deskripsi Akses |
|---|---|---|---|
| Administrator | admin@demo.test | Demo#12345 | Akses penuh dashboard admin (/admin), statistik, kelola kode redeem, kelola materi, kelola paket tryout & butir soal |
| Pengguna / Siswa | user@demo.test | Demo#12345 | Akun pengguna terdaftar untuk simulasi pengerjaan materi dan tryout |

### Kode Redeem Demo (Masa Aktif 30 Hari)

Penguji dapat langsung menukarkan kode-kode berikut pada menu Redeem (/redeem):
1. LATIH-DEMO-0001
2. LATIH-DEMO-0002
3. LATIH-DEMO-0003
4. LATIH-DEMO-0004
5. LATIH-DEMO-0005

Catatan: Sistem mendukung input fleksibel (huruf besar/kecil dan dengan atau tanpa tanda hubung strip akan dinormalisasi secara otomatis).

---

## 2. Hasil Pengerjaan Proyek

Proyek ini telah diselesaikan secara menyeluruh dengan mengedepankan kualitas arsitektur piranti lunak skala industri (Clean Architecture), keandalan keamanan data, performa serverless yang efisien, dan pengalaman pengguna yang responsif.

### Ringkasan Pencapaian Hasil Rekayasa:
1. Arsitektur Bersih (Clean Architecture): Memisahkan secara tegas antara Domain Layer (aturan bisnis murni), Use Cases Layer (alur aplikasi), Infrastructure Layer (repositori Prisma dan adapter eksternal), serta Presentation Layer (React Server Components dan Route Handlers Next.js).
2. Integritas Transaksi Atomik: Menjamin penebusan voucher kode redeem bebas dari kondisi perlombaan (race condition) menggunakan conditional update atomik pada level database engine.
3. Keamanan Ujian Tanpa Kebocoran (Zero Answer Leak): Data kunci jawaban (isTrue) dan pembahasan (explanation) secara mutlak tidak pernah disertakan dalam payload server saat tryout berstatus sedang dikerjakan (IN_PROGRESS).
4. Direct Upload Cloudinary: Pengunggahan video materi dapat dilakukan langsung dari browser ke Cloudinary menggunakan tanda tangan digital aman (HMAC-SHA1), dilengkapi indikator visual persentase real-time dan kecepatan transfer data.
5. Otomatisasi Skema Database (PgBouncer-Safe): Skema basis data PostgreSQL disinkronkan secara otomatis dan aman melalui query idempotent tanpa mengunci transaksi PgBouncer.
6. Verifikasi Kualitas Kode:
   - 22 dari 22 unit test berhasil lulus 100% menggunakan Vitest (mencakup skoring, validasi, dan konkurensi).
   - Seluruh alur pengguna dan admin berhasil diverifikasi melalui pengujian otomatis Playwright (HTTP 200 tanpa error digest SSR).

---

## 3. Fitur yang Tersedia

### A. Autentikasi dan Manajemen Pengguna
- Registrasi Pengguna Baru: Validasi nama lengkap, email unik, dan kata sandi berkekuatan standar (minimal 8 karakter kombinasi huruf dan angka).
- Autentikasi Sesi JWT: Penyimpanan token sesi pada cookie HttpOnly dengan atribut SameSite=Lax dan Secure di lingkungan produksi untuk mencegah serangan Cross-Site Scripting (XSS).
- Pembatasan Frekuensi (Rate Limiting): Proteksi 10 permintaan per menit per alamat IP pada rute login, registrasi, dan redeem untuk mencegah serangan brute force.
- Ubah Kata Sandi: Fasilitas pembaruan kata sandi secara mandiri pada halaman profil pengguna.
- Manajemen Profil & Paket Aktif: Menampilkan identitas akun, status langganan, masa berlaku, serta daftar paket tryout spesifik yang dapat diakses pengguna.

### B. Aktivasi Langganan & Kode Redeem
- Validasi dan Normalisasi Kode: Format kode voucher ditransformasikan secara konsisten (pembersihan spasi dan kapitalisasi otomatis).
- Penanganan Kesalahan Spesifik: Memberikan respon jelas jika kode tidak ditemukan, sudah digunakan oleh pengguna lain, kedaluwarsa, atau dicabut statusnya.
- Akumulasi Masa Aktif Kumulatif: Jika pengguna memasukkan kode baru saat langganan masih berjalan, masa aktif otomatis ditambahkan dari tanggal berakhir sebelumnya tanpa menghilangkan sisa hari aktif.
- Keterikatan Paket Soal Fleksibel: Kode redeem dapat diterbitkan untuk membuka seluruh tryout umum atau dibatasi khusus untuk paket tryout tertentu.

### C. Kurikulum Materi Pembelajaran Video
- Dukungan Multi-Sumber Video: Fleksibilitas pemutaran video menggunakan embed YouTube nocookie responsif (aspek rasio 16:9) maupun pemutar video Cloudinary teroptimasi.
- Direct Upload Cloudinary Berkecepatan Tinggi: Unggah video langsung dari peramban ke Cloudinary (maksimal 100 MB sesuai Cloudinary Free Plan) disertai progress bar persentase (0% - 100%) dan statistik kecepatan (MB/s).
- Pelacak Progres Belajar: Tombol status "Tandai Selesai" yang tersimpan per pengguna di database serta indikator visual progres kurikulum pada dashboard siswa.
- Akses Terproteksi: Modul video hanya dapat diakses oleh pengguna yang memiliki langganan aktif. Pengguna non-aktif diarahkan secara edukatif ke halaman redeem.

### D. Simulasi Tryout dan Ujian Berwaktu
- Format Soal Majemuk: 1 paket simulasi memuat 10 stimulus teks/kasus panjang, dengan masing-masing 3 butir pernyataan Benar atau Salah (total 30 butir pernyataan per sesi).
- Timer Tersinkronisasi Sisi Server: Batas waktu 20 menit nyata yang dihitung berdasarkan selisih waktu mulai server. Waktu tidak bertambah atau terulang meskipun peramban ditutup atau direfresh.
- Penyimpanan Jawaban Otomatis (Autosave Debounce): Jawaban siswa disimpan secara berkala ke database di latar belakang sehingga progres pengerjaan aman dari putus koneksi mendadak.
- Pengumpulan Otomatis: Saat sisa waktu habis (00:00), sistem secara otomatis mengumpulkan jawaban dan memproses penilaian di server.

### E. Penilaian dan Pembahasan Interaktif
- Perhitungan Nilai Proporsional: Setiap butir pernyataan yang dijawab benar menghasilkan 1 poin (maksimal 30 poin) dan dikonversi ke skala nilai 0 hingga 100.
- Analisis Butir Jawaban: Menampilkan rekapitulasi jumlah butir benar, salah, dan kosong.
- Pembahasan Lengkap Pasca-Ujian: Siswa dapat meninjau stimulus soal, kunci jawaban valid, pilihan yang sebelumnya dipilih, serta penjelasan konseptual pada setiap butir.
- Riwayat Pengerjaan: Rekam jejak seluruh sesi tryout yang pernah diselesaikan tersimpan rapi dan dapat ditinjau kembali kapan saja.

### F. Panel Administrasi (Admin Dashboard)
- Ringkasan Metrik Bisnis: Statistik total pengguna terdaftar, pengguna baru 7 hari terakhir, langganan aktif, langganan segera berakhir, dan rata-rata skor tryout.
- Generator Kode Redeem Massal: Kemampuan membuat kode secara batch (1 sampai 100 kode sekaligus) dengan format 12 karakter acak tanpa karakter ambigu (bebas angka 0, huruf O, angka 1, dan huruf I).
- Manajemen Kode: Pencarian kode, filter status (Aktif, Terpakai, Kedaluwarsa, Dicabut), pencabutan izin kode (revoke), dan ekspor data ke file CSV.
- Manajemen Materi Pembelajaran: Penambahan, pengeditan, pengaturan nomor urut, dan pengarsipan materi video (soft archive) agar tidak merusak data progres siswa yang sudah ada.
- Manajemen Paket Tryout & Bank Soal: Pembuatan paket tryout baru, pengaturan durasi ujian, serta fitur impor dan ekspor butir soal menggunakan template file CSV standar.

---

## 4. Prioritas Pengembangan yang Dipilih

Dalam proses perancangan dan implementasi proyek dengan batas waktu pengerjaan teknis, strategi alokasi prioritas disusun ke dalam tiga tingkatan:

### Prioritas P0 (Kebutuhan Mutlak / Core Requirements)
Fokus utama dialokasikan untuk menjamin seluruh fondasi bisnis dan keamanan sistem berjalan tanpa cacat:
1. Keamanan Transaksi Redeem: Menghindari celah race condition menggunakan transaksi atomik database.
2. Pencegahan Kebocoran Kunci: Menjamin integritas ujian online dengan menyaring kunci jawaban dari payload respons saat tryout sedang berlangsung.
3. Penegakan Otorisasi Sisi Server: Seluruh validasi hak akses dieksekusi di backend (bukan sekadar disembunyikan lewat CSS/UI).
4. Kelengkapan Alur Inti: Memastikan siklus lengkap Registrasi -> Login -> Aktivasi Kode -> Tonton Video -> Simulasi Tryout 10 Stimulus -> Hasil & Pembahasan berfungsi 100%.

### Prioritas P1 (Nilai Tambah Berbiaya Efisien)
Fitur-fitur yang meningkatkan keandalan operasional dan pengalaman pengguna secara signifikan:
1. Sinkronisasi Timer Sisi Server: Mencegah manipulasi waktu lokal pada peramban siswa.
2. Penyimpanan Progres Berkala (Autosave): Menjamin rasa aman siswa saat mengerjakan stimulus soal panjang.
3. Direct Upload Cloudinary: Mengatasi limit serverless payload 4.5 MB dengan mengalirkan file langsung ke cloud storage dilengkapi indikator persentase.
4. Fitur Operasional Admin: Batch generator kode voucher dan impor/ekspor CSV soal tryout untuk mempermudah manajemen konten penerbit.

### Prioritas P2 (Sengaja Ditunda Berdasarkan Kebutuhan Ujian)
Fitur yang diidentifikasi berada di luar ruang lingkup kebutuhan bisnis buku penerbit Liniswara:
1. Integrasi Payment Gateway Pihak Ketiga: Sesuai model bisnis buku fisik penerbit, akses tryout diperoleh melalui kode voucher yang tertera pada buku, bukan pembayaran kartu kredit/e-wallet langsung di aplikasi.
2. Login Sosial Pihak Ketiga (Google/Facebook OAuth): Autentikasi email dan kata sandi mandiri sudah mencukupi kebutuhan identifikasi data siswa.
3. Integrasi Live Proctoring Web-Camera: Dieliminasi agar sistem tetap ringan, hemat kuota siswa, dan dapat diakses lancar di berbagai perangkat peramban.

---

## 5. Tinjauan Arsitektur Piranti Lunak (Clean Architecture)

Aplikasi dibangun menggunakan prinsip Clean Architecture untuk memastikan kode terstruktur, mudah diuji secara modular, dan independen terhadap framework:

```text
src/
├── core/                         # Lapisan Inti Bisnis
│   ├── domain/
│   │   ├── entities/             # Entitas data murni (User, Subscription, Tryout, dll.)
│   │   └── repositories/         # Interface / Ports kontrak data
│   ├── use-cases/                # Use case aplikasi (Auth, Redeem, Materials, Tryout, Admin)
│   └── container.ts              # Composition Root / Dependency Injection
├── infrastructure/               # Lapisan Adapter & Infrastruktur
│   ├── repositories/             # Implementasi repositori berbasis Prisma ORM
│   └── security/                 # Adapter Jose JWT dan Bcrypt password hasher
├── app/                          # Lapisan Presentasi (Next.js 15 App Router)
│   ├── (public)/                 # Landing page, login, registrasi
│   ├── (app)/                    # Dashboard, materi, tryout, riwayat, profil, redeem
│   ├── (admin)/admin/            # Dashboard statistik admin, kode redeem, materi, tryout
│   └── api/                      # Route Handler tipis yang mendelegasikan ke use case
├── components/                   # Komponen UI modular (Navbar, Footer, Logo, Tryout)
├── lib/                          # Konfigurasi database singleton, penanganan error, validasi Zod
└── tests/                        # Pengujian unit Vitest (skoring, validasi, transaksi)
```

---

## 6. Panduan Menjalankan di Komputer Lokal

### Prasyarat Sistem:
- Node.js versi 20 ke atas
- PostgreSQL versi 14 ke atas
- Git

### Langkah Instalasi:

1. Kloning Repositori:
   ```bash
   git clone https://github.com/Salman-artz/latih.in.git
   cd latih.in
   ```

2. Konfigurasi Variabel Lingkungan:
   Salin berkas contoh konfigurasi:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan parameter `DATABASE_URL` dan kredensial Cloudinary pada berkas `.env`.

3. Instalasi Dependensi:
   ```bash
   npm install
   ```

4. Sinkronisasi Database dan Seeding Awal:
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

5. Menjalankan Pengujian Unit:
   ```bash
   npm test
   ```

6. Menjalankan Server Development:
   ```bash
   npm run dev
   ```
   Buka peramban pada alamat `http://localhost:3000`.

---

## 7. Catatan Integritas dan Penggunaan Asisten AI

Sesuai dengan standar transparansi dan profesionalisme rekayasa piranti lunak:
- Proyek ini dikembangkan dengan bantuan AI Assistant (Antigravity) dalam penyusunan template awal komponen antarmuka, pembuatan butir stimulus literasi bacaan, serta penulisan skrip migrasi data awal.
- Seluruh perancangan arsitektur sistem (Clean Architecture), logika transaksi atomik anti-race condition, perlindungan kerahasiaan kunci jawaban, algoritma skoring, sinkronisasi skema PgBouncer, dan validasi fungsional telah ditinjau, diuji, dan diverifikasi secara langsung oleh pengembang agar sesuai dengan ketentuan uji teknis PT Lini Suara Nusantara.
