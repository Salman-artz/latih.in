import { describe, it, expect } from "vitest";

describe("Aturan Skoring Tryout (30 Pernyataan)", () => {
  // Simulasi 30 pernyataan dengan kunci jawaban
  const mockKeys: Record<string, boolean> = {};
  for (let i = 1; i <= 30; i++) {
    // Selang-seling Benar dan Salah
    mockKeys[`stmt-${i}`] = i % 2 === 0;
  }

  function calculateScore(answers: Record<string, boolean | null | undefined>): {
    score: number;
    max: number;
    percent: number;
  } {
    let score = 0;
    const max = 30;

    for (const [id, isTrue] of Object.entries(mockKeys)) {
      const userAns = answers[id];
      if (userAns !== undefined && userAns !== null && userAns === isTrue) {
        score += 1;
      }
    }

    const percent = Number(((score / max) * 100).toFixed(1));
    return { score, max, percent };
  }

  it("menghitung skor sempurna jika semua 30 pernyataan dijawab benar", () => {
    const perfectAnswers: Record<string, boolean> = {};
    for (let i = 1; i <= 30; i++) {
      perfectAnswers[`stmt-${i}`] = mockKeys[`stmt-${i}`];
    }

    const result = calculateScore(perfectAnswers);
    expect(result.score).toBe(30);
    expect(result.max).toBe(30);
    expect(result.percent).toBe(100.0);
  });

  it("menghitung skor 0 jika semua pernyataan dijawab salah", () => {
    const wrongAnswers: Record<string, boolean> = {};
    for (let i = 1; i <= 30; i++) {
      wrongAnswers[`stmt-${i}`] = !mockKeys[`stmt-${i}`];
    }

    const result = calculateScore(wrongAnswers);
    expect(result.score).toBe(0);
    expect(result.percent).toBe(0.0);
  });

  it("menghitung pernyataan kosong sebagai salah (tidak menambah poin)", () => {
    const partialAnswers: Record<string, boolean | null> = {};
    // Jawab benar 15 soal
    for (let i = 1; i <= 15; i++) {
      partialAnswers[`stmt-${i}`] = mockKeys[`stmt-${i}`];
    }
    // Sisanya kosong/null
    for (let i = 16; i <= 30; i++) {
      partialAnswers[`stmt-${i}`] = null;
    }

    const result = calculateScore(partialAnswers);
    expect(result.score).toBe(15);
    expect(result.percent).toBe(50.0);
  });
});
