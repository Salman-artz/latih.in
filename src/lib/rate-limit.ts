import { prisma } from "./db";
import { AppError } from "./errors";

interface RateLimitOptions {
  key: string;
  limit?: number; // default: 10
  windowSeconds?: number; // default: 60 (1 menit)
}

/**
 * Database-backed rate limiter (Serverless compatible, no in-memory state).
 * Menghitung batas percobaan per key (misal: "login:127.0.0.1").
 */
export async function checkRateLimit({
  key,
  limit = 10,
  windowSeconds = 60,
}: RateLimitOptions): Promise<void> {
  const now = new Date();
  const windowMillis = windowSeconds * 1000;

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!existing) {
      await prisma.rateLimit.create({
        data: {
          key,
          count: 1,
          windowStart: now,
        },
      });
      return;
    }

    const elapsed = now.getTime() - existing.windowStart.getTime();

    if (elapsed > windowMillis) {
      // Jendela waktu telah kedaluwarsa, reset penghitung
      await prisma.rateLimit.update({
        where: { key },
        data: {
          count: 1,
          windowStart: now,
        },
      });
      return;
    }

    if (existing.count >= limit) {
      throw new AppError("Terlalu banyak percobaan, coba lagi nanti", 429, "RATE_LIMIT_EXCEEDED");
    }

    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Jika ada kegagalan DB rate limit, catat tapi jangan blokir alur jika tidak kritis
    console.error("Rate limit check error:", error);
  }
}
