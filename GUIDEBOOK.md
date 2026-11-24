# Buku Panduan Pengguna (User & Administrator Guidebook)
# Platform latih.in — Website Tryout & Belajar Mandiri

> Dokumen Panduan Resmi Penggunaan dan Pengelolaan Sistem.  
> Tautan Sistem: https://latihin.salmanartzdev.my.id  
> Repositori: https://github.com/Salman-artz/latih.in  

---

## Daftar Isi
1. [Pendahuluan & Konsep Ekosistem](#1-pendahuluan--konsep-ekosistem)
2. [Alur Pengguna Siswa (User Experience)](#2-alur-pengguna-siswa-user-experience)
   - 2.1 [Registrasi Akun Baru](#21-registrasi-akun-baru)
   - 2.2 [Proses Masuk (Login)](#22-proses-masuk-login)
   - 2.3 [Halaman Profil & Ubah Kata Sandi](#23-halaman-profil--ubah-kata-sandi)
   - 2.4 [Aktivasi Langganan via Kode Redeem Voucher](#24-aktivasi-langganan-via-kode-redeem-voucher)
   - 2.5 [Pembelajaran Modul Video & Pelacak Progres](#25-pembelajaran-modul-video--pelacak-progres)
   - 2.6 [Simulasi Tryout Berwaktu 20 Menit](#26-simulasi-tryout-berwaktu-20-menit)
   - 2.7 [Laporan Hasil Ujian & Pembahasan Edukatif](#27-laporan-hasil-ujian--pembahasan-edukatif)
   - 2.8 [Riwayat Pengerjaan Tryout](#28-riwayat-pengerjaan-tryout)
   - 2.9 [Keluar Sistem (Logout)](#29-keluar-sistem-logout)
3. [Alur Administrator (Admin Panel Guide)](#3-alur-administrator-admin-panel-guide)
   - 3.1 [Dashboard Metrik & Ringkasan Bisnis](#31-dashboard-metrik--ringkasan-bisnis)
   - 3.2 [Manajemen Kode Redeem Voucher](#32-manajemen-kode-redeem-voucher)
     - *Generate Batch Massal, Pencarian & Filter, Cabut Izin (Revoke), Ekspor CSV*
   - 3.3 [Manajemen Kurikulum Materi Video](#33-manajemen-kurikulum-materi-video)
     - *Tambah YouTube Embed, Direct Upload Cloudinary 100 MB, Edit, Urutkan, Arsipkan, Hapus*
   - 3.4 [Manajemen Paket Tryout & Bank Soal](#34-manajemen-paket-tryout--bank-soal)
     - *Tambah & Edit Paket, Unduh Template Excel (.xlsx), Impor Multi-Format, Ekspor Soal Round-Trip, Tambah/Edit/Hapus Butir Manual*
4. [Kamus Aksi Interaktif & Modal Dialog](#4-kamus-aksi-interaktif--modal-dialog)
5. [Akun Pengujian Demo](#5-akun-pengujian-demo)

---

## 1. Pendahuluan & Konsep Ekosistem

Platform **latih.in** dikembangkan sebagai solusi digital pendamping buku cetak terbitan PT Lini Suara Nusantara (Penerbit Buku Liniswara). 

Sistem ini menghubungkan buku fisik dengan materi digital melalui **Kode Voucher Fisik**. Pembeli buku dapat mengaktifkan kode voucher di web untuk membuka modul pembelajaran video dan mengikuti simulasi tryout berstandar ujian nasional/kedinasan.

---

## 2. Alur Pengguna Siswa (User Experience)

### 2.1 Registrasi Akun Baru
* **Tujuan:** Mendaftarkan identitas siswa ke dalam sistem agar riwayat belajar dan masa aktif tersimpan permanen.
* **Halaman:** `/register` (dapat diakses dari tombol *Daftar Sekarang* di navigasi landing page).
* **Langkah-langkah:**
  1. Masukkan **Nama Lengkap**.
  2. Masukkan **Alamat Email Aktif** (email bersifat unik, satu email untuk satu akun).
  3. Masukkan **Kata Sandi** (minimal 8 karakter kombinasi huruf dan angka).
  4. Klik tombol **Daftar Akun**.
* **Keamanan:** Dilengkapi sistem *Rate Limiting* (maksimal 10 pendaftaran per menit per IP) guna mencegah pembuatan akun bot.

---

### 2.2 Proses Masuk (Login)
* **Tujuan:** Mengotentikasi pengguna dan menerbitkan token sesi JWT aman.
* **Halaman:** `/login`.
* **Langkah-langkah:**
  1. Masukkan email dan kata sandi terdaftar.
  2. Klik tombol **Masuk**.
  3. Sistem memverifikasi kecocokan sandi menggunakan algoritma *Bcrypt*.
  4. Jika berhasil, sesi disimpan di peramban dalam bentuk cookie `HttpOnly` dengan atribut `SameSite=Lax` dan `Secure` (kebal dari pencurian skrip XSS).
  5. Pengguna otomatis diarahkan ke `/dashboard` (siswa) atau `/admin` (jika berstatus administrator).

---

### 2.3 Halaman Profil & Ubah Kata Sandi
* **Tujuan:** Meninjau identitas, memeriksa status paket aktif, dan memperbarui kata sandi akun secara mandiri.
* **Halaman:** `/profil`.
* **Aksi yang Tersedia:**
  * **Tinjau Info Akun:** Melihat nama, email terdaftar, dan tanggal bergabung.
  * **Cek Paket Langganan Aktif:** Menampilkan sisa hari aktif langganan dan tanggal berakhir.
  * **Ubah Kata Sandi:**
    1. Masukkan *Kata Sandi Lama*.
    2. Masukkan *Kata Sandi Baru* (minimal 8 karakter).
    3. Masukkan *Konfirmasi Kata Sandi Baru*.
    4. Klik **Simpan Kata Sandi Baru**.

---

### 2.4 Aktivasi Langganan via Kode Redeem Voucher
* **Tujuan:** Membuka akses materi video dan simulasi tryout menggunakan kode voucher yang didapat dari buku fisik.
* **Halaman:** `/redeem`.
* **Fitur & Logika Sistem:**
  * **Smart Normalizer:** Siswa bebas mengetik kode dengan huruf kecil, huruf besar, atau tanpa tanda hubung strip (misal: `latihdemo0001` atau `LATIH-DEMO-0001`). Sistem akan menormalisasinya secara otomatis.
  * **Akumulasi Masa Aktif Kumulatif:** Apabila siswa menukarkan voucher saat langganan sebelumnya masih aktif, masa berlaku voucher baru akan **ditambahkan** ke tanggal berakhir lama. Sisa hari sebelumnya tidak akan pernah hilang atau hangus.
  * **Proteksi Transaksi Atomik:** Transaksi divalidasi langsung di database engine sehingga 1 kode voucher tidak bisa diklaim secara ganda oleh dua orang dalam waktu bersamaan (*anti-race condition*).

---

### 2.5 Pembelajaran Modul Video & Pelacak Progres
* **Tujuan:** Mempelajari materi konseptual sebelum menguji pemahaman di sesi tryout.
* **Halaman:** `/materi` dan `/materi/[id]`.
* **Fitur Pembelajaran:**
  * **Proteksi Akses:** Modul video hanya terbuka untuk siswa dengan langganan aktif. Siswa non-aktif akan diarahkan secara edukatif untuk menukarkan voucher.
  * **Pemutar Video Adaptif:** Mendukung dua metode pemutaran:
    * *YouTube No-Cookie Embed:* Ringan, hemat kuota, rasio 16:9 responsif.
    * *Cloudinary Video Player:* Pemutaran video berkecepatan tinggi yang dioptimalkan untuk perangkat mobile.
  * **Tandai Selesai:** Siswa dapat menekan tombol *Tandai Selesai* setelah menonton. Status ini tersimpan di database dan memperbarui persentase ketercapaian silabus pada dashboard siswa.

---

### 2.6 Simulasi Tryout Berwaktu 20 Menit
* **Tujuan:** Mensimulasikan ujian sesungguhnya secara berwaktu dan terstandar.
* **Halaman:** `/tryout` (daftar paket) dan `/tryout/[attemptId]` (lembar pengerjaan).
* **Format & Ketentuan Soal:**
  * **1 Paket Tryout:** Terdiri dari **10 Stimulus Teks** (bacaan panjang / kasus kontekstual).
  * **Struktur Soal:** Setiap stimulus memiliki **3 Butir Pernyataan** yang masing-masing harus dijawab **BENAR** atau **SALAH** (total 30 butir pernyataan per ujian).
* **Mekanisme Ujian:**
  * **Timer Sinkron Server:** Waktu pengerjaan 20 menit dihitung berdasarkan selisih waktu mulai server. Waktu tidak bertambah jika siswa menutup tab, me-refresh peramban, atau memajukan jam laptop.
  * **Penyimpanan Otomatis (Autosave Debounce):** Setiap pilihan jawaban siswa langsung dikirim dan disimpan ke server di latar belakang tanpa mengganggu alur membaca siswa.
  * **Pengumpulan Otomatis (Auto-Submit):** Saat sisa waktu mencapai `00:00`, sistem secara otomatis mengunci lembar jawaban, mengumpulkannya ke server, dan memproses skor akhir.
  * **Pengumpulan Mandiri:** Siswa dapat menekan tombol *Kumpulkan Ujian*. Sistem akan memunculkan modal konfirmasi untuk mencegah ketidaksengajaan klik.

---

### 2.7 Laporan Hasil Ujian & Pembahasan Edukatif
* **Tujuan:** Memberikan umpan balik instan mengenai performa belajar siswa.
* **Halaman:** `/tryout/[attemptId]/hasil`.
* **Informasi yang Ditampilkan:**
  * **Skor Akhir Proporsional (Skala 0 - 100):** Dihitung dari jumlah butir pernyataan yang dijawab benar (setiap butir bernilai 1 poin, maksimal 30 poin, lalu dikonversi ke skala 100).
  * **Rekapitulasi Butir:** Menampilkan total butir Benar, butir Salah, dan butir Kosong.
  * **Pembahasan Mendalam:** Siswa dapat meninjau kembali seluruh stimulus soal, jawaban yang mereka pilih, kunci jawaban yang benar, serta penjelasan konseptual edukatif pada setiap butir.
  * **Zero Answer Leak:** Kunci jawaban dan teks pembahasan secara mutlak baru dikirim oleh server setelah tryout berstatus selesai (*SUBMITTED* / *EXPIRED*). Kunci tidak dapat diintip selama pengerjaan.

---

### 2.8 Riwayat Pengerjaan Tryout
* **Tujuan:** Memantau tren perkembangan nilai dari waktu ke waktu.
* **Halaman:** `/riwayat`.
* **Fungsi:** Menyimpan daftar seluruh sesi tryout yang pernah dikerjakan siswa lengkap dengan tanggal ujian, paket tryout, skor perolehan, dan tautan untuk meninjau kembali lembar pembahasan.

---

### 2.9 Keluar Sistem (Logout)
* **Tujuan:** Menutup sesi aktif pengguna secara aman.
* **Aksi:** Klik tombol *Keluar* pada bilah navigasi.
* **Mekanisme:** Sistem menghapus cookie otentikasi sesi di peramban dan mengarahkan pengguna kembali ke halaman utama publik.

---

## 3. Alur Administrator (Admin Panel Guide)

### 3.1 Dashboard Metrik & Ringkasan Bisnis
* **Halaman:** `/admin`.
* **Metrik yang Dipantau:**
  * Total Pengguna Terdaftar & Siswa Baru (7 hari terakhir).
  * Total Langganan Aktif vs Langganan Segera Berakhir.
  * Rata-rata Skor Tryout seluruh siswa.
  * Status kesiapan bank soal dan modul materi kurikulum.

---

### 3.2 Manajemen Kode Redeem Voucher
* **Halaman:** `/admin/kode`.
* **Aksi & Fitur yang Tersedia:**
  1. **Batch Generator Massal (Buat Kode Baru):**
     * Klik tombol **Generate Kode**.
     * Masukkan jumlah kode yang diinginkan (antara 1 hingga 100 kode sekali klik).
     * Tentukan masa aktif (default 30 hari).
     * Berikan label kelompok (misal: *Buku TPA BUMN Cetakan 1*).
     * Klik **Generate**. Sistem membuat kode acak 12 karakter anti-ambigu (bebas angka 0, huruf O, angka 1, dan huruf I agar tidak keliru dibaca saat dicetak di kertas).
  2. **Filter & Pencarian Kode:**
     * Cari kode berdasarkan kata kunci.
     * Filter berdasarkan status: *Semua*, *Aktif*, *Terpakai*, *Kedaluwarsa*, atau *Dicabut (Revoked)*.
  3. **Cabut Izin Kode (Revoke):**
     * Tombol **Cabut** digunakan jika ada voucher fisik yang rusak, hilang, atau dibatalkan peredarannya.
     * Memunculkan modal dialog konfirmasi bahaya (*Danger Modal*).
     * Kode yang dicabut statusnya langsung dinonaktifkan permanen dan tidak dapat lagi digunakan oleh siswa mana pun.
  4. **Ekspor Data ke File CSV:**
     * Klik tombol **Ekspor CSV**.
     * Sistem menghasilkan file CSV lengkap dengan **BOM UTF-8 (`\uFEFF`)** sehingga data rapi dan tidak berantakan saat dibuka langsung di Microsoft Excel, siap diserahkan ke bagian percetakan buku.

---

### 3.3 Manajemen Kurikulum Materi Video
* **Halaman:** `/admin/materi`.
* **Aksi & Fitur yang Tersedia:**
  1. **Tambah Materi Baru (Metode YouTube):**
     * Klik **Tambah Materi**.
     * Masukkan Judul Materi, Deskripsi Pembelajaran, dan Nomor Urut.
     * Pilih tipe video **YouTube**, lalu masukkan tautan URL video YouTube. Sistem secara otomatis mengekstrak ID video dan mengonversinya ke pemutar nocookie responsif.
  2. **Tambah Materi Baru (Metode Direct Upload Cloudinary 100 MB):**
     * Pilih tipe video **Upload Mandiri (Cloudinary)**.
     * Pilih berkas video dari komputer (format `.mp4`, `.webm`, `.mov`).
     * Sistem memvalidasi ukuran berkas (maksimal 100 MB sesuai Cloudinary Free Plan).
     * Alur Unggah: Peramban meminta tanda tangan digital (HMAC-SHA1) dari backend, lalu mengalirkan file video langsung ke Cloudinary (*Direct Upload*).
     * Tampil *Progress Bar* persentase (0% s/d 100%) dan speedometer kecepatan transfer data (MB/s).
  3. **Edit Materi Pembelajaran:**
     * Klik ikon **Edit** pada baris materi.
     * Admin dapat memperbarui judul, narasi deskripsi, nomor urut silabus, atau mengganti sumber video.
  4. **Arsipkan Materi (Soft Archive):**
     * Opsi status materi: **Terbit (Published)** atau **Arsip (Archived)**.
     * Materi yang diarsipkan tidak akan tampil di katalog siswa, namun data progres siswa yang sebelumnya pernah menonton materi ini tetap terjaga utuh.
  5. **Hapus Materi Pembelajaran:**
     * Klik ikon **Hapus** (tempat sampah).
     * Memunculkan modal konfirmasi bahaya (*Danger Modal*) untuk mencegah penghapusan materi yang tidak disengaja.

---

### 3.4 Manajemen Paket Tryout & Bank Soal
* **Halaman:** `/admin/tryout` (Daftar Paket) dan `/admin/tryout/[id]` (Detail Kelola Bank Soal).
* **Aksi & Fitur yang Tersedia:**
  1. **Buat & Edit Paket Tryout:**
     * Tentukan Judul Paket Tryout (misal: *Simulasi Literasi & Logika Penalaran*).
     * Atur durasi pengerjaan ujian (default 20 menit).
     * Atur status paket: **Terbit (PUBLISHED)** agar dapat dikerjakan siswa, atau **Draf (DRAFT)** selama soal masih disiapkan.
  2. **Unduh Template Excel Resmi (`.xlsx`):**
     * Pada halaman kelola butir soal (`/admin/tryout/[id]`), klik tombol **Template Excel (.xlsx)**.
     * File Excel yang terunduh memuat 2 Sheet:
       * *Sheet 1 (Petunjuk Pengisian):* Panduan teknis pengisian format soal Benar/Salah.
       * *Sheet 2 (Template Soal):* 11 kolom dengan penataan lebar otomatis (*auto-width*) dan 3 contoh soal terisi.
  3. **Impor Soal Multi-Format (`.xlsx`, `.xls`, `.csv`):**
     * Klik tombol **Impor Excel / CSV**, lalu pilih berkas bank soal dari komputer.
     * Sistem membaca sheet soal, memvalidasi struktur 3 pernyataan per butir stimulus, dan menyimpannya secara otomatis ke database.
     * Notifikasi keberhasilan memunculkan modal dialog berisi jumlah butir soal yang berhasil terimpor.
  4. **Ekspor Soal Round-Trip (`.xlsx`):**
     * Klik tombol **Ekspor Excel (.xlsx)**.
     * Sistem menghasilkan file Excel berstruktur lengkap:
       * *Sheet 1 (Informasi Tryout):* Metadata paket ujian (ID paket, judul, durasi, total butir, waktu ekspor).
       * *Sheet 2 (Daftar Soal):* Seluruh 11 kolom butir soal stimulus, pernyataan 1-3, kunci, dan pembahasan.
     * File hasil ekspor ini kompatibel penuh (*round-trip ready*), artinya dapat langsung diedit di laptop lalu diunggah kembali ke sistem tanpa merubah format kolom.
  5. **Tambah, Edit, dan Hapus Butir Soal Satuan Secara Manual:**
     * **Tambah Soal:** Klik tombol *Tambah Soal* untuk mengisi stimulus teks bacaan, 3 butir kalimat pernyataan, kunci nilai (Benar/Salah), dan ulasan pembahasan edukatif melalui modal form.
     * **Edit Soal:** Mengoreksi stimulus teks atau kunci pembahasan butir tertentu kapan saja.
     * **Hapus Soal:** Menghapus butir soal tertentu. Sistem otomatis menata ulang nomor urut (*re-indexing*) soal-soal setelahnya agar urutan 1 s/d N tetap rapi.

---

## 4. Kamus Aksi Interaktif & Modal Dialog

Seluruh antarmuka **latih.in** tidak lagi menggunakan popup jadul bawaan peramban yang bertuliskan *"... says"*. Sistem menerapkan **SaaS Modal Dialog** kustom berbasis Tailwind CSS dengan animasi fade, backdrop blur, dan keyboard shortcut (tombol `Escape` untuk membatalkan):

| Jenis Modal Dialog | Warna & Ikon | Kegunaan dalam Sistem |
|---|---|---|
| **Alert (Informasi)** | Biru (Info / AlertCircle) | Menampilkan pesan validasi, informasi format, atau notifikasi edukatif. |
| **Confirm (Konfirmasi)** | Biru Brand (CheckCircle) | Meminta persetujuan sebelum memulai ujian tryout atau submit jawaban. |
| **Danger (Aksi Kritis)** | Merah (AlertTriangle / Trash) | Mengonfirmasi aksi yang tidak dapat dibatalkan: **Hapus Soal**, **Hapus Materi**, **Hapus Paket**, atau **Cabut Izin Kode Voucher (Revoke)**. |
| **Success (Berhasil)** | Hijau (CheckCircle2) | Memberikan konfirmasi bahwa proses berhasil dilakukan, seperti setelah selesai mengimpor puluhan butir soal Excel. |

---

## 5. Akun Pengujian Demo

Untuk keperluan uji teknis dan evaluasi sistem, penguji dapat menggunakan akun siap pakai berikut:

| Peran Akun | Alamat Email | Kata Sandi | Lingkup Hak Akses |
|---|---|---|---|
| **Administrator** | `admin@demo.test` | `Demo#12345` | Akses penuh dashboard `/admin`, kelola kode, kelola materi, dan bank soal tryout. |
| **Siswa / User** | `user@demo.test` | `Demo#12345` | Akses siswa `/dashboard`, belajar video, klaim voucher, dan simulasi tryout. |

### Kode Voucher Uji Coba (Masa Aktif 30 Hari):
1. `LATIH-DEMO-0001`
2. `LATIH-DEMO-0002`
3. `LATIH-DEMO-0003`
4. `LATIH-DEMO-0004`
5. `LATIH-DEMO-0005`
