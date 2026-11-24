import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { redeemCode } from "@/services/redeem";
import { updateRedeemCode } from "@/services/admin";

describe("Logika Transaksi Redeem & Konkurensi", () => {
  let testUserId: string;
  let hasDatabase = false;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL tidak disetel. Melewati uji database integrasi.");
      return;
    }
    try {
      await prisma.$connect();
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
      hasDatabase = true;
    } catch (err) {
      console.warn("Koneksi database tidak tersedia. Melewati uji integrasi.", err);
      hasDatabase = false;
    }
  });

  afterAll(async () => {
    if (hasDatabase) {
      await prisma.$disconnect();
    }
  });

  it("redeem kode valid mengaktifkan langganan baru (startsAt = now, endsAt = now + durationDays)", async () => {
    if (!hasDatabase) return;
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

  it("redeem kedua oleh user yang sama ditolak (CODE_ALREADY_REDEEMED)", async () => {
    if (!hasDatabase) return;
    const codeStr = `TESTUSED${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: codeStr,
        durationDays: 15,
        maxUses: 5,
        isUsed: false,
      },
    });

    // Redeem pertama sukses
    await redeemCode(testUserId, codeStr);

    // Redeem kedua oleh user yang sama harus ditolak
    await expect(redeemCode(testUserId, codeStr)).rejects.toThrow(
      "Kamu sudah pernah menukarkan kode redeem ini sebelumnya"
    );
  });

  it("multi-quota: kode dengan kuota 2 dapat digunakan oleh 2 user berbeda, lalu ditolak untuk user ke-3", async () => {
    if (!hasDatabase) return;
    const multiCode = `TESTMULTI${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: multiCode,
        durationDays: 10,
        maxUses: 2,
        isUsed: false,
      },
    });

    // Buat user ke-2 & user ke-3
    const user2 = await prisma.user.upsert({
      where: { email: "test-user2@demo.test" },
      update: {},
      create: {
        email: "test-user2@demo.test",
        name: "Test User 2",
        passwordHash: "dummy",
      },
    });

    const user3 = await prisma.user.upsert({
      where: { email: "test-user3@demo.test" },
      update: {},
      create: {
        email: "test-user3@demo.test",
        name: "Test User 3",
        passwordHash: "dummy",
      },
    });

    // User 1 redeem (1/2) -> Sukses
    const res1 = await redeemCode(testUserId, multiCode);
    expect(res1.subscription).toBeDefined();

    // User 2 redeem (2/2) -> Sukses
    const res2 = await redeemCode(user2.id, multiCode);
    expect(res2.subscription).toBeDefined();

    // Verifikasi status kode di DB sekarang isUsed = true & usedCount = 2
    const dbCode = await prisma.redeemCode.findUnique({ where: { code: multiCode } });
    expect(dbCode?.usedCount).toBe(2);
    expect(dbCode?.isUsed).toBe(true);

    // User 3 redeem -> Gagal karena kuota habis
    await expect(redeemCode(user3.id, multiCode)).rejects.toThrow(
      "Kuota penukaran kode ini sudah habis"
    );
  });

  it("konkurensi: dua panggilan paralel dengan kode yang sama menghasilkan tepat satu sukses", async () => {
    if (!hasDatabase) return;
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

  it("administrator tidak dapat melakukan redeem kode", async () => {
    if (!hasDatabase) return;
    const adminUser = await prisma.user.upsert({
      where: { email: "test-admin-redeem@demo.test" },
      update: { role: "ADMIN" },
      create: {
        email: "test-admin-redeem@demo.test",
        name: "Test Admin",
        passwordHash: "dummy",
        role: "ADMIN",
      },
    });

    const adminCode = `TESTADM${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: adminCode,
        durationDays: 30,
        isUsed: false,
      },
    });

    await expect(redeemCode(adminUser.id, adminCode)).rejects.toThrow(
      "Administrator tidak dapat melakukan redeem kode atau berlangganan"
    );
  });

  it("fitur edit: update kode, durasi, dan kuota berhasil dilakukan", async () => {
    if (!hasDatabase) return;
    const initialCode = `TESTEDIT${Date.now()}`;
    const created = await prisma.redeemCode.create({
      data: {
        code: initialCode,
        durationDays: 10,
        maxUses: 1,
        isUsed: false,
      },
    });

    const newCode = `EDITED${Date.now()}`;
    const updated = await updateRedeemCode(created.id, {
      code: newCode,
      durationDays: 60,
      maxUses: 50,
      label: "Promo Khusus",
    });

    expect(updated.code).toBe(newCode);
    expect(updated.durationDays).toBe(60);
    expect(updated.maxUses).toBe(50);
    expect(updated.label).toBe("Promo Khusus");
  });

  it("fitur edit: menurunkan kuota di bawah usedCount ditolak (INVALID_MAX_USES)", async () => {
    if (!hasDatabase) return;
    const usedCode = `TESTUSEDEDIT${Date.now()}`;
    const created = await prisma.redeemCode.create({
      data: {
        code: usedCode,
        durationDays: 30,
        maxUses: 5,
        usedCount: 3,
        isUsed: false,
      },
    });

    await expect(
      updateRedeemCode(created.id, {
        maxUses: 2,
      })
    ).rejects.toThrow("Kuota tidak boleh lebih kecil dari jumlah pengguna yang sudah menukarkan kode (3 pengguna)");
  });

  it("redeem kode spesifik paket tryout: menghasilkan langganan khusus tryout dan muncul di daftar paket pengguna", async () => {
    if (!hasDatabase) return;

    // 1. Buat tryout uji
    const testTryout = await prisma.tryout.create({
      data: {
        title: `Tryout Khusus Uji ${Date.now()}`,
        durationMinutes: 30,
        status: "PUBLISHED",
      },
    });

    // 2. Buat kode redeem terkait tryout tersebut
    const tryoutCodeStr = `TRYOUTPAKET${Date.now()}`;
    await prisma.redeemCode.create({
      data: {
        code: tryoutCodeStr,
        durationDays: 45,
        tryoutId: testTryout.id,
        label: "Paket Khusus Tryout Uji",
      },
    });

    // 3. Redeem oleh user uji
    const res = await redeemCode(testUserId, tryoutCodeStr);
    expect(res.subscription).toBeDefined();

    // 4. Periksa data di database
    const subDb = await prisma.subscription.findUnique({
      where: { id: res.subscription.id },
      include: { tryout: true },
    });
    expect(subDb?.tryoutId).toBe(testTryout.id);
    expect(subDb?.tryout?.title).toBe(testTryout.title);

    // 5. Bersihkan data tryout
    await prisma.subscription.deleteMany({ where: { tryoutId: testTryout.id } });
    await prisma.redeemCode.deleteMany({ where: { tryoutId: testTryout.id } });
    await prisma.tryout.delete({ where: { id: testTryout.id } });
  });
});
