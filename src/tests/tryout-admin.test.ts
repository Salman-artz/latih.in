import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import {
  getQuestionTemplateCsv,
  exportTryoutQuestionsCsv,
  exportTryoutQuestionsXlsx,
  importTryoutQuestionsFromCsv,
  createAdminTryout,
} from "@/services/admin-tryout";
import { parseCsvString, toCsvString } from "@/lib/csv-helper";

describe("Admin Tryout & Question CSV Utilities", () => {
  let testTryoutId: string;
  let hasDatabase = false;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) return;
    try {
      await prisma.$connect();
      hasDatabase = true;
      const t = await createAdminTryout({
        title: "Test Tryout CSV Batch",
        durationMinutes: 25,
      });
      testTryoutId = t.id;
    } catch {
      hasDatabase = false;
    }
  });

  afterAll(async () => {
    if (hasDatabase && testTryoutId) {
      await prisma.tryout.delete({ where: { id: testTryoutId } }).catch(() => {});
      await prisma.$disconnect();
    }
  });

  it("parseCsvString menangani koma, baris baru, dan kutip ganda secara tepat", () => {
    const raw = `"1","Teks dengan koma, dan kutip ""kutip""","Pernyataan 1","BENAR","Penjelasan"`;
    const parsed = parseCsvString(raw);
    expect(parsed.length).toBe(1);
    expect(parsed[0][0]).toBe("1");
    expect(parsed[0][1]).toBe('Teks dengan koma, dan kutip "kutip"');
    expect(parsed[0][2]).toBe("Pernyataan 1");
    expect(parsed[0][3]).toBe("BENAR");
  });

  it("getQuestionTemplateCsv menghasilkan template CSV yang valid dan dapat di-parse", () => {
    const template = getQuestionTemplateCsv();
    expect(template).toContain("Nomor Soal");
    expect(template).toContain("Teks Stimulus Soal");
    expect(template).toContain("Pernyataan 1");
    const parsed = parseCsvString(template);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
  });

  it("importTryoutQuestionsFromCsv berhasil memasukkan butir soal dari CSV ke database", async () => {
    if (!hasDatabase || !testTryoutId) return;

    const csvData = [
      ["Nomor Soal", "Teks Stimulus Soal", "Pernyataan 1", "Kunci 1 (BENAR/SALAH)", "Pembahasan 1", "Pernyataan 2", "Kunci 2 (BENAR/SALAH)", "Pembahasan 2"],
      ["1", "Stimulus bacaan soal impor satu...", "Pernyataan pertama benar", "BENAR", "Pembahasan satu", "Pernyataan kedua salah", "SALAH", "Pembahasan dua"],
      ["2", "Stimulus bacaan soal impor dua...", "Pernyataan soal 2 benar", "BENAR", "Pembahasan soal 2", "Pernyataan 2.2 salah", "SALAH", "Pembahasan 2.2"],
    ];

    const csvString = toCsvString(csvData[0], csvData.slice(1));
    const result = await importTryoutQuestionsFromCsv(testTryoutId, csvString);

    expect(result.importedCount).toBe(2);

    const exported = await exportTryoutQuestionsCsv(testTryoutId);
    expect(exported).toContain("Stimulus bacaan soal impor satu...");
    expect(exported).toContain("Stimulus bacaan soal impor dua...");

    const { buffer, filename } = await exportTryoutQuestionsXlsx(testTryoutId);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
    expect(filename).toContain(".xlsx");
  });
});
