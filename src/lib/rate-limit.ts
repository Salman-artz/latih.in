import { prisma } from "./db";
import { AppError } from "./errors";

interface RateLimitOptions {
  key: string;
  limit?: number; // default: 10
  windowSeconds?: number; // default: 60 (1 menit)
}

// In-memory fallback limiter jika DB table belum siap atau koneksi terganggu
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(key: string, limit: number, windowSeconds: number): void {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }
  if (entry.count >= limit) {
    throw new AppError("Terlalu banyak percobaan, coba lagi nanti", 429, "RATE_LIMIT_EXCEEDED");
  }
  entry.count += 1;
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
    // Pembersihan entri usang secara probabilistik (~5% request) agar tabel tidak menumpuk
    if (Math.random() < 0.05) {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      prisma.rateLimit
        .deleteMany({
          where: { windowStart: { lt: oneDayAgo } },
        })
        .catch(() => {});
    }

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
    // Fallback ke in-memory limiter jika DB RateLimit belum dibuat / koneksi error
    checkMemoryRateLimit(key, limit, windowSeconds);
  }
}
