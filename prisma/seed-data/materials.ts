export interface SeedMaterial {
  title: string;
  description: string;
  youtubeId: string;
  order: number;
}

// Catatan: Gunakan YouTube video ID yang publik dan mengizinkan embed.
// Reviewer/penguji dapat mengganti ID di bawah bila diperlukan.
export const seedMaterials: SeedMaterial[] = [
  {
    title: "Teknik Membaca Kritis dan Menemukan Ide Pokok",
    description: "Pelajari strategi membaca cepat dan efektif untuk menemukan gagasan utama dalam paragraf panjang pada soal literasi.",
    youtubeId: "Wn6p_y7m15M", // Video edukasi literasi membaca
    order: 1,
  },
  {
    title: "Analisis Logika dan Silogisme dalam Penalaran Umum",
    description: "Pahami dasar-dasar logika proposisional, modus ponens, modus tollens, dan penarikan kesimpulan yang valid.",
    youtubeId: "8nhZ_9u9b7U", // Video penalaran logika
    order: 2,
  },
  {
    title: "Membedakan Fakta, Opini, dan Asumsi Penulis",
    description: "Cara membedakan klaim berbasis data objektif versus asumsi implisit dalam teks argumentatif.",
    youtubeId: "GS_z1n8zI1g", // Video analisis teks
    order: 3,
  },
  {
    title: "Strategi Menjawab Soal Pernyataan Benar/Salah",
    description: "Trik mengeliminasi opsi jebakan pada tipe soal majemuk benar/salah agar skor maksimal.",
    youtubeId: "dQw4w9WgXcQ", // Catatan: Dapat diganti dengan video kurikulum lokal jika diperlukan
    order: 4,
  },
  {
    title: "Manajemen Waktu Efektif Saat Tryout Berdurasi Singkat",
    description: "Tips membagi alokasi waktu 20 menit untuk 10 soal bacaan panjang tanpa panik.",
    youtubeId: "tgbNymZ7vqY", // Video strategi belajar
    order: 5,
  },
];
