import { prisma } from "@/lib/db";
import { normalizeRedeemCode } from "@/lib/validators/redeem";
import { AppError } from "@/lib/errors";

export class RedeemCodeUseCase {
  async execute(userId: string, rawCode: string) {
    const code = normalizeRedeemCode(rawCode);
    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // Administrator dilarang me-redeem kode atau berlangganan
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role === "ADMIN") {
        throw new AppError(
          "Administrator tidak dapat melakukan redeem kode atau berlangganan. Fitur ini khusus untuk akun Siswa.",
          403,
          "ADMIN_CANNOT_REDEEM"
        );
      }

      const updateResult = await tx.redeemCode.updateMany({
        where: {
          code,
          isUsed: false,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          isUsed: true,
          usedById: userId,
          usedAt: now,
        },
      });

      if (updateResult.count !== 1) {
        const existing = await tx.redeemCode.findUnique({ where: { code } });
        if (!existing) throw new AppError("Kode redeem tidak valid", 400, "CODE_INVALID");
        if (existing.isUsed) throw new AppError("Kode redeem sudah digunakan", 400, "CODE_ALREADY_USED");
        if (existing.revokedAt) throw new AppError("Kode redeem sudah dicabut", 400, "CODE_REVOKED");
        if (existing.expiresAt && existing.expiresAt <= now) throw new AppError("Kode redeem sudah kedaluwarsa", 400, "CODE_EXPIRED");
        throw new AppError("Kode redeem tidak valid", 400, "CODE_INVALID");
      }

      const codeRecord = await tx.redeemCode.findUniqueOrThrow({ where: { code } });

      const currentActiveSub = await tx.subscription.findFirst({
        where: { userId, endsAt: { gt: now } },
        orderBy: { endsAt: "desc" },
      });

      const durationMillis = codeRecord.durationDays * 24 * 60 * 60 * 1000;
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
          codeId: codeRecord.id,
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
          durationDays: codeRecord.durationDays,
        },
      };
    });
  }
}
