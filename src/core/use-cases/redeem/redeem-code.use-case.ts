import { prisma } from "@/lib/db";
import { normalizeRedeemCode } from "@/lib/validators/redeem";
import { AppError } from "@/lib/errors";

export class RedeemCodeUseCase {
  async execute(userId: string, rawCode: string) {
    const code = normalizeRedeemCode(rawCode);
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // 1. Administrator dilarang me-redeem kode atau berlangganan
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role === "ADMIN") {
        throw new AppError(
          "Administrator tidak dapat melakukan redeem kode atau berlangganan. Fitur ini khusus untuk akun Pengguna.",
          403,
          "ADMIN_CANNOT_REDEEM"
        );
      }

      // 2. Ambil data kode redeem
      const existing = await tx.redeemCode.findUnique({ where: { code } });
      if (!existing) {
        throw new AppError("Kode redeem tidak valid", 400, "CODE_INVALID");
      }
      if (existing.revokedAt) {
        throw new AppError("Kode redeem sudah dicabut", 400, "CODE_REVOKED");
      }
      if (existing.expiresAt && existing.expiresAt <= now) {
        throw new AppError("Kode redeem sudah kedaluwarsa", 400, "CODE_EXPIRED");
      }
      if (existing.isUsed || existing.usedCount >= existing.maxUses) {
        throw new AppError("Kuota penukaran kode ini sudah habis", 400, "CODE_ALREADY_USED");
      }

      // 3. Pastikan user ini belum pernah menukarkan kode ini
      const alreadyRedeemed = await tx.subscription.findFirst({
        where: {
          userId,
          codeId: existing.id,
        },
      });
      if (alreadyRedeemed) {
        throw new AppError("Kamu sudah pernah menukarkan kode redeem ini sebelumnya", 400, "CODE_ALREADY_REDEEMED");
      }

      // 4. Update kuota secara atomik (concurrency safe)
      const willBeFull = existing.usedCount + 1 >= existing.maxUses;
      const updateResult = await tx.redeemCode.updateMany({
        where: {
          id: existing.id,
          usedCount: { lt: existing.maxUses },
          isUsed: false,
          revokedAt: null,
        },
        data: {
          usedCount: { increment: 1 },
          isUsed: willBeFull,
          usedById: userId,
          usedAt: now,
        },
      });

      if (updateResult.count !== 1) {
        throw new AppError("Kuota penukaran kode ini baru saja habis oleh pengguna lain", 400, "CODE_ALREADY_USED");
      }

      // 5. Perpanjang atau aktifkan langganan user
      const currentActiveSub = await tx.subscription.findFirst({
        where: {
          userId,
          tryoutId: existing.tryoutId || null,
          endsAt: { gt: now },
        },
        orderBy: { endsAt: "desc" },
      });

      const durationMillis = existing.durationDays * 24 * 60 * 60 * 1000;
      const startsAt = now;
      let endsAt: Date;

      if (currentActiveSub) {
        endsAt = new Date(currentActiveSub.endsAt.getTime() + durationMillis);
      } else {
        endsAt = new Date(now.getTime() + durationMillis);
      }

      const subscription = await tx.subscription.create({
        data: {
          userId,
          codeId: existing.id,
          tryoutId: existing.tryoutId,
          source: "REDEEM",
          startsAt,
          endsAt,
        },
      });

      return {
        subscription: {
          id: subscription.id,
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
          durationDays: existing.durationDays,
        },
      };
    });
  }
}
