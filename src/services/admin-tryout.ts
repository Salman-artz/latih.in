import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ContentStatus } from "@prisma/client";
import { toCsvString, parseCsvString } from "@/lib/csv-helper";
import * as XLSX from "xlsx";

export async function getAdminTryouts() {
  return await prisma.tryout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
  });
}

export async function createAdminTryout(data: {
  title: string;
  durationMinutes?: number;
  status?: "PUBLISHED" | "DRAFT";
}) {
  return await prisma.tryout.create({
    data: {
      title: data.title,
      durationMinutes: data.durationMinutes || 20,
      status: (data.status as ContentStatus) || ContentStatus.PUBLISHED,
    },
  });
}

export async function getAdminTryoutDetail(tryoutId: string) {
  const tryout = await prisma.tryout.findUnique({
    where: { id: tryoutId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          statements: {
            orderBy: { order: "asc" },
          },
        },
      },
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (!tryout) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  return tryout;
}

export async function updateAdminTryout(
  id: string,
  data: {
    title?: string;
    durationMinutes?: number;
    status?: "PUBLISHED" | "DRAFT";
  }
) {
  const existing = await prisma.tryout.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  return await prisma.tryout.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
      ...(data.status !== undefined ? { status: data.status as ContentStatus } : {}),
    },
  });
}

export async function deleteAdminTryout(id: string) {
  const existing = await prisma.tryout.findUnique({
    where: { id },
    include: {
      _count: {
        select: { attempts: true },
      },
    },
  });

  if (!existing) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  return await prisma.tryout.delete({
    where: { id },
  });
}

export async function createAdminQuestion(
  tryoutId: string,
  data: {
    order?: number;
    stem: string;
    statements: {
      order?: number;
      text: string;
      isTrue: boolean;
      explanation: string;
    }[];
  }
) {
  const tryout = await prisma.tryout.findUnique({ where: { id: tryoutId } });
  if (!tryout) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  // Tentukan order jika tidak diberikan
  let order = data.order;
  if (!order) {
    const lastQuestion = await prisma.question.findFirst({
      where: { tryoutId },
      orderBy: { order: "desc" },
    });
    order = (lastQuestion?.order || 0) + 1;
  }

  return await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        tryoutId,
        order,
        stem: data.stem,
        statements: {
          create: data.statements.map((s, index) => ({
            order: s.order || index + 1,
            text: s.text,
            isTrue: s.isTrue,
            explanation: s.explanation,
          })),
        },
      },
      include: {
        statements: {
          orderBy: { order: "asc" },
        },
      },
    });

    return question;
  });
}

export async function updateAdminQuestion(
  tryoutId: string,
  questionId: string,
  data: {
    order?: number;
    stem?: string;
    statements?: {
      id?: string;
      order?: number;
      text: string;
      isTrue: boolean;
      explanation: string;
    }[];
  }
) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    include: { statements: true },
  });

  if (!existing || existing.tryoutId !== tryoutId) {
    throw new AppError("Soal tidak ditemukan", 404, "NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    if (data.statements) {
      // Hapus statements lama dan buat ulang agar urutan & integritas terjaga
      await tx.statement.deleteMany({
        where: { questionId },
      });

      await tx.statement.createMany({
        data: data.statements.map((s, index) => ({
          questionId,
          order: s.order || index + 1,
          text: s.text,
          isTrue: s.isTrue,
          explanation: s.explanation,
        })),
      });
    }

    const updated = await tx.question.update({
      where: { id: questionId },
      data: {
        ...(data.stem !== undefined ? { stem: data.stem } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
      include: {
        statements: {
          orderBy: { order: "asc" },
        },
      },
    });

    return updated;
  });
}

export async function deleteAdminQuestion(tryoutId: string, questionId: string) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!existing || existing.tryoutId !== tryoutId) {
    throw new AppError("Soal tidak ditemukan", 404, "NOT_FOUND");
  }

  await prisma.question.delete({
    where: { id: questionId },
  });

  // Re-index remaining questions
  const remaining = await prisma.question.findMany({
    where: { tryoutId },
    orderBy: { order: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i + 1) {
      await prisma.question.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      });
    }
  }

  return { success: true };
}

const CSV_QUESTION_HEADERS = [
  "Nomor Soal",
  "Teks Stimulus Soal",
  "Pernyataan 1",
  "Kunci 1 (BENAR/SALAH)",
  "Pembahasan 1",
  "Pernyataan 2",
  "Kunci 2 (BENAR/SALAH)",
  "Pembahasan 2",
  "Pernyataan 3",
  "Kunci 3 (BENAR/SALAH)",
  "Pembahasan 3",
];

export function getQuestionTemplateCsv(): string {
  const sampleRows = [
    [
      1,
      "Sebuah survei membaca di kalangan siswa menunjukkan bahwa 65% siswa lebih memilih membaca artikel digital daripada buku cetak. Namun, 75% siswa menyatakan mereka lebih mengingat rincian cerita saat membaca buku fisik.",
      "Mayoritas responden survei lebih menikmati format digital untuk membaca.",
      "BENAR",
      "Sebanyak 65% siswa (mayoritas) memilih artikel digital dibanding buku cetak.",
      "Retensi ingatan siswa terbukti lebih tinggi saat membaca melalui layar digital.",
      "SALAH",
      "Sebanyak 75% siswa lebih mengingat rincian saat membaca buku fisik, bukan digital.",
      "Kenyamanan membaca format digital selalu berbanding lurus dengan pemahaman mendalam.",
      "SALAH",
      "Peneliti menyimpulkan kenyamanan digital tidak selalu menjamin pemahaman informasi mendalam.",
    ],
    [
      2,
      "Semua peserta pelatihan robotika yang lulus ujian praktik wajib memiliki sertifikat elektronika dasar. Sebagian mahasiswa teknik elektro tidak memiliki sertifikat tersebut. Farhan adalah mahasiswa teknik elektro yang telah lulus ujian praktik.",
      "Farhan pasti memiliki sertifikat elektronika dasar.",
      "BENAR",
      "Farhan telah lulus ujian praktik, dan semua yang lulus wajib memiliki sertifikat tersebut.",
      "Semua mahasiswa teknik elektro lulus ujian praktik pelatihan robotika.",
      "SALAH",
      "Teks hanya menyebutkan sebagian mahasiswa tidak memiliki sertifikat, tidak ada premis semua lulus.",
      "Ada mahasiswa teknik elektro yang tidak mengikuti atau tidak lulus ujian praktik.",
      "BENAR",
      "Mahasiswa tanpa sertifikat dipastikan tidak lulus karena sertifikat adalah syarat wajib lulus.",
    ],
    [
      3,
      "Kecerdasan Buatan (AI) berkembang pesat dalam dekade terakhir. Meskipun automasi meningkatkan produktivitas hingga 40%, laporan riset ketenagakerjaan mencatat bahwa pekerjaan yang membutuhkan empati, kepemimpinan, dan komunikasi interpersonal justru mengalami kenaikan permintaan pasar sebesar 25%.",
      "Automasi teknologi berkontribusi terhadap penurunan seluruh jenis lapangan pekerjaan.",
      "SALAH",
      "Pekerjaan berbasis empati dan kepemimpinan justru mengalami kenaikan permintaan sebesar 25%.",
      "Peningkatan produktivitas akibat automasi tercatat mencapai 40%.",
      "BENAR",
      "Sesuai kutipan teks, automasi terbukti meningkatkan produktivitas kerja hingga 40%.",
      "Keterampilan komunikasi interpersonal diprediksi semakin tidak dibutuhkan di era AI.",
      "SALAH",
      "Permintaan pasar untuk keterampilan interpersonal justru meningkat sebesar 25%.",
    ],
  ];

  // Tambahkan UTF-8 BOM (\uFEFF) agar jika dibuka di Excel langsung rapi per kolom
  return "\uFEFF" + toCsvString(CSV_QUESTION_HEADERS, sampleRows);
}

export function getQuestionTemplateXlsx(): Buffer {
  const petunjukRows = [
    ["PANDUAN PENGISIAN TEMPLATE SOAL TRYOUT (latih.in)"],
    [""],
    ["Ketentuan Format Soal:"],
    ["1. Buka sheet 'Template Soal' di sebelah tab ini untuk mengisi butir soal."],
    ["2. Setiap 1 baris mewakili 1 Soal (Stimulus Teks / Kasus Panjang)."],
    ["3. Setiap 1 Soal wajib memiliki tepat 3 Butir Pernyataan yang dijawab BENAR atau SALAH."],
    ["4. Kolom 'Kunci' harus diisi persis dengan kata: BENAR atau SALAH."],
    ["5. Kolom 'Pembahasan' wajib diisi penjelasan edukatif mengapa butir tersebut bernilai Benar atau Salah."],
    ["6. Kolom lebar sudah disesuaikan agar teks bacaan panjang mudah dibaca."],
    ["7. Setelah selesai mengisi, simpan file ini dan unggah langsung ke menu Kelola Tryout di website latih.in."],
    [""],
    ["Struktur Kolom Sheet 'Template Soal':"],
    ["A. Nomor Soal          : Nomor urut soal (1, 2, 3, dst.)"],
    ["B. Teks Stimulus Soal   : Paragraf bacaan / stimulus / narasi soal"],
    ["C. Pernyataan 1         : Kalimat pernyataan butir pertama"],
    ["D. Kunci 1              : BENAR atau SALAH"],
    ["E. Pembahasan 1         : Penjelasan kunci pernyataan pertama"],
    ["F. Pernyataan 2         : Kalimat pernyataan butir kedua"],
    ["G. Kunci 2              : BENAR atau SALAH"],
    ["H. Pembahasan 2         : Penjelasan kunci pernyataan kedua"],
    ["I. Pernyataan 3         : Kalimat pernyataan butir ketiga"],
    ["J. Kunci 3              : BENAR atau SALAH"],
    ["K. Pembahasan 3         : Penjelasan kunci pernyataan ketiga"],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukRows);
  wsPetunjuk["!cols"] = [{ wch: 85 }];

  const sampleData = [
    [
      1,
      "Sebuah survei membaca di kalangan siswa menunjukkan bahwa 65% siswa lebih memilih membaca artikel digital daripada buku cetak. Namun, 75% siswa menyatakan mereka lebih mengingat rincian cerita saat membaca buku fisik.",
      "Mayoritas responden survei lebih menikmati format digital untuk membaca.",
      "BENAR",
      "Sebanyak 65% siswa (mayoritas) memilih artikel digital dibanding buku cetak.",
      "Retensi ingatan siswa terbukti lebih tinggi saat membaca melalui layar digital.",
      "SALAH",
      "Sebanyak 75% siswa lebih mengingat rincian saat membaca buku fisik, bukan digital.",
      "Kenyamanan membaca format digital selalu berbanding lurus dengan pemahaman mendalam.",
      "SALAH",
      "Peneliti menyimpulkan kenyamanan digital tidak selalu menjamin pemahaman informasi mendalam.",
    ],
    [
      2,
      "Semua peserta pelatihan robotika yang lulus ujian praktik wajib memiliki sertifikat elektronika dasar. Sebagian mahasiswa teknik elektro tidak memiliki sertifikat tersebut. Farhan adalah mahasiswa teknik elektro yang telah lulus ujian praktik.",
      "Farhan pasti memiliki sertifikat elektronika dasar.",
      "BENAR",
      "Farhan telah lulus ujian praktik, dan semua yang lulus wajib memiliki sertifikat tersebut.",
      "Semua mahasiswa teknik elektro lulus ujian praktik pelatihan robotika.",
      "SALAH",
      "Teks hanya menyebutkan sebagian mahasiswa tidak memiliki sertifikat, tidak ada premis semua lulus.",
      "Ada mahasiswa teknik elektro yang tidak mengikuti atau tidak lulus ujian praktik.",
      "BENAR",
      "Mahasiswa tanpa sertifikat dipastikan tidak lulus karena sertifikat adalah syarat wajib lulus.",
    ],
    [
      3,
      "Kecerdasan Buatan (AI) berkembang pesat dalam dekade terakhir. Meskipun automasi meningkatkan produktivitas hingga 40%, laporan riset ketenagakerjaan mencatat bahwa pekerjaan yang membutuhkan empati, kepemimpinan, dan komunikasi interpersonal justru mengalami kenaikan permintaan pasar sebesar 25%.",
      "Automasi teknologi berkontribusi terhadap penurunan seluruh jenis lapangan pekerjaan.",
      "SALAH",
      "Pekerjaan berbasis empati dan kepemimpinan justru mengalami kenaikan permintaan sebesar 25%.",
      "Peningkatan produktivitas akibat automasi tercatat mencapai 40%.",
      "BENAR",
      "Sesuai kutipan teks, automasi terbukti meningkatkan produktivitas kerja hingga 40%.",
      "Keterampilan komunikasi interpersonal diprediksi semakin tidak dibutuhkan di era AI.",
      "SALAH",
      "Permintaan pasar untuk keterampilan interpersonal justru meningkat sebesar 25%.",
    ],
  ];

  const wsSoal = XLSX.utils.aoa_to_sheet([CSV_QUESTION_HEADERS, ...sampleData]);

  // Lebar kolom rapi dan proporsional untuk Excel
  wsSoal["!cols"] = [
    { wch: 12 }, // Nomor Soal
    { wch: 60 }, // Teks Stimulus Soal
    { wch: 35 }, // Pernyataan 1
    { wch: 22 }, // Kunci 1 (BENAR/SALAH)
    { wch: 40 }, // Pembahasan 1
    { wch: 35 }, // Pernyataan 2
    { wch: 22 }, // Kunci 2 (BENAR/SALAH)
    { wch: 40 }, // Pembahasan 2
    { wch: 35 }, // Pernyataan 3
    { wch: 22 }, // Kunci 3 (BENAR/SALAH)
    { wch: 40 }, // Pembahasan 3
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk Pengisian");
  XLSX.utils.book_append_sheet(wb, wsSoal, "Template Soal");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function exportTryoutQuestionsCsv(tryoutId: string): Promise<string> {
  const tryout = await prisma.tryout.findUnique({
    where: { id: tryoutId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          statements: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!tryout) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  const rows = tryout.questions.map((q) => {
    const s1 = q.statements[0];
    const s2 = q.statements[1];
    const s3 = q.statements[2];

    return [
      q.order,
      q.stem,
      s1?.text || "",
      s1 ? (s1.isTrue ? "BENAR" : "SALAH") : "",
      s1?.explanation || "",
      s2?.text || "",
      s2 ? (s2.isTrue ? "BENAR" : "SALAH") : "",
      s2?.explanation || "",
      s3?.text || "",
      s3 ? (s3.isTrue ? "BENAR" : "SALAH") : "",
      s3?.explanation || "",
    ];
  });

  return toCsvString(CSV_QUESTION_HEADERS, rows);
}

export async function importTryoutQuestionsFromCsv(tryoutId: string, csvInput: string | Buffer) {
  const tryout = await prisma.tryout.findUnique({ where: { id: tryoutId } });
  if (!tryout) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  let dataRows: string[][] = [];

  if (Buffer.isBuffer(csvInput)) {
    try {
      const wb = XLSX.read(csvInput, { type: "buffer" });
      const sheetName =
        wb.SheetNames.find((s) => s.toLowerCase().includes("soal")) ||
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        defval: "",
      });
      if (rawRows.length > 1) {
        dataRows = rawRows.slice(1).map((r) => (r as unknown[]).map((c) => String(c ?? "")));
      }
    } catch {
      const parsed = parseCsvString(csvInput.toString("utf8"));
      if (parsed.length > 1) dataRows = parsed.slice(1);
    }
  } else {
    const parsed = parseCsvString(csvInput);
    if (parsed.length > 1) {
      dataRows = parsed.slice(1);
    }
  }

  if (dataRows.length === 0) {
    throw new AppError("File spreadsheet kosong atau hanya berisi baris header", 400, "EMPTY_CSV");
  }

  const questionsToCreate: {
    stem: string;
    statements: { text: string; isTrue: boolean; explanation: string }[];
  }[] = [];

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];
    if (row.length < 5) continue; // Baris terlalu pendek

    const stem = row[1] || row[0]; // Kolom 1 adalah stem
    if (!stem || stem.trim().length < 5) continue;

    const statements: { text: string; isTrue: boolean; explanation: string }[] = [];

    // Baca pasangan Pernyataan (Kolom 2, 3, 4), (Kolom 5, 6, 7), (Kolom 8, 9, 10)...
    let col = 2;
    while (col + 2 < row.length) {
      const text = (row[col] || "").trim();
      const keyRaw = (row[col + 1] || "").trim().toUpperCase();
      const explanation = (row[col + 2] || "").trim();

      if (text.length > 0) {
        const isTrue =
          keyRaw === "BENAR" ||
          keyRaw === "TRUE" ||
          keyRaw === "1" ||
          keyRaw === "B";

        statements.push({
          text,
          isTrue,
          explanation: explanation || "Pembahasan belum disertakan.",
        });
      }
      col += 3;
    }

    if (statements.length > 0) {
      questionsToCreate.push({
        stem: stem.trim(),
        statements,
      });
    }
  }

  if (questionsToCreate.length === 0) {
    throw new AppError("Tidak ada butir soal valid yang dapat dibaca dari file CSV", 400, "NO_VALID_QUESTIONS");
  }

  // Dapatkan nomor urut awal
  const lastQuestion = await prisma.question.findFirst({
    where: { tryoutId },
    orderBy: { order: "desc" },
  });
  let startingOrder = (lastQuestion?.order || 0) + 1;

  // Masukkan secara batch di dalam transaksi
  await prisma.$transaction(async (tx) => {
    for (const q of questionsToCreate) {
      await tx.question.create({
        data: {
          tryoutId,
          order: startingOrder++,
          stem: q.stem,
          statements: {
            create: q.statements.map((s, idx) => ({
              order: idx + 1,
              text: s.text,
              isTrue: s.isTrue,
              explanation: s.explanation,
            })),
          },
        },
      });
    }
  });

  return {
    importedCount: questionsToCreate.length,
    message: `Berhasil mengimpor ${questionsToCreate.length} butir soal ke dalam tryout.`,
  };
}
