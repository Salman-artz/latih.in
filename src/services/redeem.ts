import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { normalizeRedeemCode } from "@/lib/validators/redeem";
import { SubscriptionSource } from "@prisma/client";

export async function redeemCode(userId: string, rawCode: string) {
  const code = normalizeRedeemCode(rawCode);
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Update atomik bersyarat: hanya jika isUsed=false, belum dicabut, dan belum kedaluwarsa
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

    // 2. Jika update tidak mempengaruhi 1 baris, selidiki alasan kegagalan
    if (updateResult.count !== 1) {
      const existing = await tx.redeemCode.findUnique({
        where: { code },
      });

      if (!existing) {
        throw new AppError("Kode redeem tidak valid", 400, "CODE_INVALID");
      }
      if (existing.isUsed) {
        throw new AppError("Kode redeem sudah digunakan", 400, "CODE_ALREADY_USED");
      }
      if (existing.revokedAt) {
        throw new AppError("Kode redeem sudah dicabut", 400, "CODE_REVOKED");
      }
      if (existing.expiresAt && existing.expiresAt <= now) {
        throw new AppError("Kode redeem sudah kedaluwarsa", 400, "CODE_EXPIRED");
      }

      throw new AppError("Kode redeem tidak valid", 400, "CODE_INVALID");
    }

    // Ambil data kode yang baru diupdate
    const codeRecord = await tx.redeemCode.findUniqueOrThrow({
      where: { code },
    });

    // 3. Periksa apakah user sudah memiliki langganan aktif untuk perpanjangan akumulatif
    const currentActiveSub = await tx.subscription.findFirst({
      where: {
        userId,
        endsAt: {
          gt: now,
        },
      },
      orderBy: {
        endsAt: "desc",
      },
    });

    const durationMillis = codeRecord.durationDays * 24 * 60 * 60 * 1000;
    const startsAt = now;
    let endsAt: Date;

    if (currentActiveSub) {
      // Perpanjangan: akumulasikan dari endsAt yang sedang berlaku
      endsAt = new Date(currentActiveSub.endsAt.getTime() + durationMillis);
    } else {
      // Langganan baru: mulai dari sekarang
      endsAt = new Date(now.getTime() + durationMillis);
    }

    const subscription = await tx.subscription.create({
      data: {
        userId,
        codeId: codeRecord.id,
        source: SubscriptionSource.REDEEM,
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
