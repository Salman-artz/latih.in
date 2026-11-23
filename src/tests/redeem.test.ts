import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { redeemCode } from "@/services/redeem";

describe("Logika Transaksi Redeem & Konkurensi", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Siapkan user uji
    const user = await prisma.user.upsert({
      where: { email: "test-redeemer@demo.test" },
      update: {},
      create: {
        email: "test-redeemer@demo.test",
        name: "Test Redeemer",
        passwordHash: "dummy",
      },
    });
    testUserId = user.id;

    // Bersihkan data subscription test user jika ada
    await prisma.subscription.deleteMany({
      where: { userId: testUserId },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("redeem kode valid mengaktifkan langganan baru (startsAt = now, endsAt = now + durationDays)", async () => {
    const codeStr = `TESTCODE${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: codeStr,
        durationDays: 30,
        isUsed: false,
      },
    });

    const result = await redeemCode(testUserId, codeStr);
    expect(result.subscription).toBeDefined();
    expect(result.subscription.durationDays).toBe(30);

    const diffDays = Math.round(
      (new Date(result.subscription.endsAt).getTime() - new Date(result.subscription.startsAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });

  it("redeem kedua dengan kode yang sama ditolak (CODE_ALREADY_USED)", async () => {
    const codeStr = `TESTUSED${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: codeStr,
        durationDays: 15,
        isUsed: false,
      },
    });

    // Redeem pertama sukses
    await redeemCode(testUserId, codeStr);

    // Redeem kedua harus gagal
    await expect(redeemCode(testUserId, codeStr)).rejects.toThrow("Kode redeem sudah digunakan");
  });

  it("konkurensi: dua panggilan paralel dengan kode yang sama menghasilkan tepat satu sukses", async () => {
    const concurrentCode = `TESTCONC${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: concurrentCode,
        durationDays: 30,
        isUsed: false,
      },
    });

    // Jalankan 2 panggilan bersamaan
    const results = await Promise.allSettled([
      redeemCode(testUserId, concurrentCode),
      redeemCode(testUserId, concurrentCode),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});
