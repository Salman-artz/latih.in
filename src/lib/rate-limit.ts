import { prisma } from "./db";
import { AppError } from "./errors";

interface RateLimitOptions {
  key: string;
  limit?: number; // default: 10
  windowSeconds?: number; // default: 60 (1 menit)
}

// In-memory limiter untuk performa instan (0ms) tanpa network latency
const memoryStore = new Map<string, { count: number; resetAt: number }>();
let isDbRateLimitDisabled = false;

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
 * High-performance Rate Limiter dengan in-memory fast-path + database fallback
 */
export async function checkRateLimit({
  key,
  limit = 10,
  windowSeconds = 60,
}: RateLimitOptions): Promise<void> {
  // 1. Eksekusi in-memory fast-path terlebih dahulu (0ms)
  checkMemoryRateLimit(key, limit, windowSeconds);

  // Jika tabel DB sebelumnya gagal/tidak ada, jangan buang waktu network roundtrip ke DB
  if (isDbRateLimitDisabled) {
    return;
  }

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
    // Jika tabel DB RateLimit tidak ada / koneksi error, nonaktifkan akses DB rate limit agar request selanjutnya instan
    isDbRateLimitDisabled = true;
  }
}
