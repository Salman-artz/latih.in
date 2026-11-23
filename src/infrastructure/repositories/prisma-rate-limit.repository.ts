import { prisma } from "@/lib/db";
import { IRateLimitRepository } from "@/core/domain/repositories/rate-limit.repository.interface";

export class PrismaRateLimitRepository implements IRateLimitRepository {
  async checkLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = new Date();
    const windowMillis = windowSeconds * 1000;

    try {
      const existing = await prisma.rateLimit.findUnique({ where: { key } });

      if (!existing) {
        await prisma.rateLimit.create({
          data: { key, count: 1, windowStart: now },
        });
        return true;
      }

      const elapsed = now.getTime() - existing.windowStart.getTime();

      if (elapsed > windowMillis) {
        await prisma.rateLimit.update({
          where: { key },
          data: { count: 1, windowStart: now },
        });
        return true;
      }

      if (existing.count >= limit) {
        return false;
      }

      await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });

      return true;
    } catch {
      return true;
    }
  }
}
