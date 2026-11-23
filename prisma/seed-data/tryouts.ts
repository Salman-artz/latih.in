export interface SeedStatement {
  order: number;
  text: string;
  isTrue: boolean;
  explanation: string;
}

export interface SeedQuestion {
  order: number;
  stem: string;
  statements: [SeedStatement, SeedStatement, SeedStatement];
}

export const seedQuestions: SeedQuestion[] = [
  {
    order: 1,
    stem: "Sebuah survei membaca di kalangan siswa SMA menunjukkan bahwa 65% siswa lebih memilih membaca artikel digital daripada buku cetak. Namun, 75% siswa menyatakan mereka lebih mengingat rincian cerita saat membaca buku fisik. Peneliti menyimpulkan bahwa kenyamanan format digital tidak selalu berbanding lurus dengan retensi pemahaman informasi mendalam.",
    statements: [
      {
        order: 1,
        text: "Mayoritas responden survei lebih menikmati format digital untuk membaca.",
        isTrue: true,
        explanation: "Sebanyak 65% siswa (mayoritas) memilih artikel digital dibanding buku cetak.",
      },
      {
        order: 2,
        text: "Retensi ingatan siswa terbukti lebih tinggi saat membaca melalui layar digital.",
        isTrue: false,
        explanation: "Sebanyak 75% siswa lebih mengingat rincian saat membaca buku fisik, bukan digital.",
      },
      {
        order: 3,
        text: "Peneliti menyimpulkan kenyamanan membaca digital menjamin pemahaman materi yang mendalam.",
        isTrue: false,
        explanation: "Peneliti justru menyimpulkan bahwa kenyamanan digital tidak selalu berbanding lurus dengan retensi mendalam.",
      },
    ],
  },
  {
    order: 2,
    stem: "Semua peserta pelatihan robotika yang lulus ujian praktik wajib memiliki sertifikat elektronika dasar. Sebagian mahasiswa teknik elektro tidak memiliki sertifikat elektronika dasar. Farhan adalah mahasiswa teknik elektro yang telah lulus ujian praktik pelatihan robotika.",
    statements: [
      {
        order: 1,
        text: "Farhan pasti memiliki sertifikat elektronika dasar.",
        isTrue: true,
        explanation: "Karena Farhan lulus ujian praktik pelatihan robotika, dan semua yang lulus wajib memiliki sertifikat tersebut.",
      },
      {
        order: 2,
        text: "Semua mahasiswa teknik elektro lulus ujian praktik pelatihan robotika.",
        isTrue: false,
        explanation: "Teks hanya menyebutkan sebagian mahasiswa teknik elektro tidak memiliki sertifikat, tidak ada premis bahwa semua mahasiswa elektro lulus.",
      },
      {
        order: 3,
        text: "Ada mahasiswa teknik elektro yang tidak mengikuti atau tidak lulus ujian praktik robotika.",
        isTrue: true,
        explanation: "Mahasiswa teknik elektro yang tidak memiliki sertifikat dipastikan tidak lulus ujian praktik karena syarat lulus wajib punya sertifikat.",
      },
    ],
  },
  {
    order: 3,
    stem: "Penggunaan panel surya pada perumahan perkotaan meningkat 40% dalam dua tahun terakhir. Penurunan biaya produksi sel surya dan kenaikan tarif listrik konvensional menjadi pemicu utama tren ini. Namun, efisiensi energi surya menurun hingga 15% pada wilayah dengan tingkat polusi udara tinggi karena partikel debu menghalangi radiasi cahaya matahari.",
    statements: [
      {
        order: 1,
        text: "Polusi udara di perkotaan dapat menurunkan kinerja efisiensi panel surya.",
        isTrue: true,
        explanation: "Teks menyatakan polusi udara dapat menurunkan efisiensi energi surya hingga 15% karena debu menghalangi radiasi.",
      },
      {
        order: 2,
        text: "Kenaikan tarif listrik konvensional mendorong minat warga beralih ke panel surya.",
        isTrue: true,
        explanation: "Kenaikan tarif listrik konvensional secara eksplisit disebut sebagai salah satu pemicu utama tren peningkatan panel surya.",
      },
      {
        order: 3,
        text: "Biaya produksi sel surya semakin mahal sehingga adopsi masyarakat melambat.",
        isTrue: false,
        explanation: "Teks justru menyebutkan terjadinya penurunan biaya produksi sel surya yang memicu peningkatan penggunaan sebesar 40%.",
      },
    ],
  },
  {
    order: 4,
    stem: "Dalam sebuah eksperimen kognitif, siswa yang belajar materi baru selama 25 menit lalu beristirahat 5 menit (Teknik Pomodoro) memperoleh skor pemahaman 20% lebih tinggi dibanding siswa yang belajar terus-menerus selama 2 jam tanpa jeda. Istirahat singkat membantu konsolidasi memori di hippocampus.",
    statements: [
      {
        order: 1,
        text: "Belajar tanpa istirahat selama 2 jam terbukti lebih efektif meningkatkan pemahaman kognitif.",
        isTrue: false,
        explanation: "Siswa yang belajar dengan jeda istirahat memperoleh skor 20% lebih tinggi daripada yang belajar tanpa jeda.",
      },
      {
        order: 2,
        text: "Jeda istirahat singkat memberikan waktu bagi otak untuk mengonsolidasikan memori.",
        isTrue: true,
        explanation: "Teks menyatakan secara langsung bahwa istirahat singkat membantu konsolidasi memori di hippocampus.",
      },
      {
        order: 3,
        text: "Teknik Pomodoro dalam teks membagi waktu 25 menit belajar dan 5 menit istirahat.",
        isTrue: true,
        explanation: "Sesuai definisi pada stimulus eksperimen kognitif tersebut.",
      },
    ],
  },
  {
    order: 5,
    stem: "Jika tingkat inflasi naik di atas 5%, maka bank sentral akan menaikkan suku bunga acuan. Jika suku bunga acuan naik, maka bunga kredit perbankan akan meningkat dan konsumsi masyarakat akan melambat. Saat ini, bank sentral memutuskan untuk menaikkan suku bunga acuan.",
    statements: [
      {
        order: 1,
        text: "Pasti terjadi peningkatan tingkat inflasi di atas 5% sebelumnya.",
        isTrue: false,
        explanation: "Bank sentral bisa saja menaikkan suku bunga karena faktor lain (fallacy of affirming the consequent). Syarat cukup bukan syarat perlu mutlak.",
      },
      {
        order: 2,
        text: "Bunga kredit perbankan diperkirakan akan mengalami kenaikan.",
        isTrue: true,
        explanation: "Premis kedua menyatakan jika suku bunga acuan naik, bunga kredit perbankan akan meningkat.",
      },
      {
        order: 3,
        text: "Konsumsi masyarakat diproyeksikan tidak terpengaruh oleh kenaikan suku bunga.",
        isTrue: false,
        explanation: "Teks menegaskan bahwa kenaikan suku bunga mengakibatkan konsumsi masyarakat melambat.",
      },
    ],
  },
  {
    order: 6,
    stem: "Sebuah laporan kesehatan lingkungan menyatakan bahwa konsumsi air minum mikroplastik telah ditemukan pada 80% sampel air kemasan sekali pakai. Meskipun dampak jangka panjang terhadap metabolisme manusia masih diteliti, beberapa studi pendahuluan mengindikasikan potensi peradangan pada saluran pencernaan.",
    statements: [
      {
        order: 1,
        text: "Seluruh (100%) sampel air minum kemasan yang diuji bebas dari kontaminasi partikel mikroplastik.",
        isTrue: false,
        explanation: "Laporan menemukan mikroplastik pada 80% sampel air kemasan sekali pakai.",
      },
      {
        order: 2,
        text: "Dampak jangka panjang mikroplastik pada metabolisme manusia telah sepenuhnya dipahami secara final.",
        isTrue: false,
        explanation: "Teks menyatakan dampak jangka panjang terhadap metabolisme masih dalam tahap penelitian.",
      },
      {
        order: 3,
        text: "Studi pendahuluan menunjukkan indikasi mikroplastik berpotensi memicu peradangan pencernaan.",
        isTrue: true,
        explanation: "Teks menyebutkan studi pendahuluan mengindikasikan potensi peradangan pada saluran pencernaan.",
      },
    ],
  },
  {
    order: 7,
    stem: "Di sebuah perusahaan rintisan teknologi, lima orang desainer UI (Agus, Budi, Citra, Dodi, Eka) duduk melingkar. Citra selalu duduk di sebelah kanan Agus. Dodi tidak boleh duduk bersebelahan dengan Agus maupun Budi. Eka duduk tepat di antara Dodi dan Agus.",
    statements: [
      {
        order: 1,
        text: "Eka bertetangga langsung tempat duduknya dengan Agus.",
        isTrue: true,
        explanation: "Karena Eka duduk tepat di antara Dodi dan Agus, posisi Eka bersebelahan dengan Agus.",
      },
      {
        order: 2,
        text: "Dodi duduk bersebelahan langsung dengan Citra.",
        isTrue: true,
        explanation: "Dalam susunan melingkar 5 orang (Agus, Citra, Budi, Dodi, Eka), posisi Dodi berada di antara Budi dan Eka, serta bersebelahan sesuai konfigurasi valid.",
      },
      {
        order: 3,
        text: "Budi duduk tepat di sebelah kiri Agus.",
        isTrue: false,
        explanation: "Di sebelah Agus ada Citra (kanan) dan Eka (kiri), sehingga Budi tidak bersebelahan langsung dengan Agus.",
      },
    ],
  },
  {
    order: 8,
    stem: "Pemerintah kota memberlakukan kebijakan tarif parkir progresif untuk mengurangi volume kendaraan pribadi di jalan protokol. Data tiga bulan pertama mencatat penurunan volume kendaraan roda empat sebesar 18%, sementara penggunaan transportasi umum bus listrik meningkat sebesar 32%.",
    statements: [
      {
        order: 1,
        text: "Penerapan tarif parkir progresif berkorelasi dengan penurunan volume kendaraan roda empat di jalan protokol.",
        isTrue: true,
        explanation: "Data mencatat penurunan kendaraan roda empat sebesar 18% setelah kebijakan parkir diterapkan.",
      },
      {
        order: 2,
        text: "Penggunaan bus listrik mengalami penurunan drastis setelah kebijakan parkir diterapkan.",
        isTrue: false,
        explanation: "Penggunaan transportasi umum bus listrik justru meningkat sebesar 32%.",
      },
      {
        order: 3,
        text: "Tujuan utama kebijakan tarif parkir progresif adalah mengoptimalkan pendapatan retribusi swasta.",
        isTrue: false,
        explanation: "Teks menyebut tujuan utama kebijakan adalah mengurangi volume kendaraan pribadi di jalan protokol.",
      },
    ],
  },
  {
    order: 9,
    stem: "Kecerdasan Buatan Generatif (GenAI) mampu menghasilkan ringkasan dokumen ilmiah dalam hitungan detik. Kendati demikian, fenomena 'halusinasi' di mana model menghasilkan kutipan palsu atau klaim tidak berdasar masih terjadi pada 15-20% respon dokumen medis khusus tanpa pengawasan ahli.",
    statements: [
      {
        order: 1,
        text: "GenAI selalu menghasilkan ringkasan yang 100% akurat tanpa risiko kesalahan informasi.",
        isTrue: false,
        explanation: "Masih terdapat fenomena 'halusinasi' pada 15-20% respon untuk dokumen medis tanpa pengawasan ahli.",
      },
      {
        order: 2,
        text: "Fenomena halusinasi GenAI merujuk pada situasi di mana model menyajikan kutipan atau klaim yang sebenarnya tidak nyata.",
        isTrue: true,
        explanation: "Sesuai definisi pada teks yaitu menghasilkan kutipan palsu atau klaim tidak berdasar.",
      },
      {
        order: 3,
        text: "Verifikasi manusia ahli tetap diperlukan saat memanfaatkan GenAI untuk dokumen medis khusus.",
        isTrue: true,
        explanation: "Teks mengindikasikan risiko halusinasi 15-20% terjadi ketika tidak ada pengawasan dari ahli.",
      },
    ],
  },
  {
    order: 10,
    stem: "Produksi kakao nasional mengalami penurunan 12% akibat perubahan pola cuaca ekstrem El Nino yang memperpanjang musim kemarau. Di sisi lain, harga jual biji kakao di pasar internasional melonjak 45%, sehingga pendapatan sebagian petani kakao yang berhasil mempertahankan panen justru meningkat.",
    statements: [
      {
        order: 1,
        text: "El Nino menyebabkan musim hujan berkepanjangan yang merusak tanaman kakao.",
        isTrue: false,
        explanation: "Teks menyatakan El Nino memperpanjang musim kemarau, bukan musim hujan.",
      },
      {
        order: 2,
        text: "Lonjakan harga kakao global dapat mengimbangi dampak penurunan produksi bagi petani yang tetap memiliki hasil panen.",
        isTrue: true,
        explanation: "Karena harga melonjak 45%, petani yang panennya bertahan mengalami peningkatan pendapatan.",
      },
      {
        order: 3,
        text: "Penurunan produksi kakao nasional berbanding terbalik dengan arah pergerakan harga di pasar internasional.",
        isTrue: true,
        explanation: "Produksi turun 12% sementara harga internasional melonjak naik 45%.",
      },
    ],
  },
];
