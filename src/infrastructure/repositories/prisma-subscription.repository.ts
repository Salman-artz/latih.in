import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { SubscriptionEntity } from "@/core/domain/entities/subscription.entity";

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async findActiveByUserId(userId: string, now: Date, tryoutId?: string): Promise<SubscriptionEntity | null> {
    try {
      const where: Prisma.SubscriptionWhereInput = {
        userId,
        endsAt: { gt: now },
      };

      if (tryoutId) {
        where.OR = [
          { tryoutId: null },
          { tryoutId: tryoutId },
        ];
      }

      const sub = await prisma.subscription.findFirst({
        where,
        orderBy: { endsAt: "desc" },
      });
      if (!sub) return null;
      return {
        ...sub,
        source: sub.source as "REDEEM" | "MANUAL",
      };
    } catch (err) {
      console.warn("findActiveByUserId query fallback:", err);
      try {
        const subFallback = await prisma.subscription.findFirst({
          where: { userId, endsAt: { gt: now } },
          orderBy: { endsAt: "desc" },
        });
        if (!subFallback) return null;
        return {
          ...subFallback,
          source: subFallback.source as "REDEEM" | "MANUAL",
        };
      } catch {
        return null;
      }
    }
  }

  async findAllByUserId(userId: string): Promise<(SubscriptionEntity & { tryoutTitle?: string | null; code?: string | null; codeLabel?: string | null })[]> {
    try {
      const subs = await prisma.subscription.findMany({
        where: { userId },
        orderBy: { endsAt: "desc" },
        include: {
          tryout: {
            select: { title: true },
          },
          code: {
            select: { code: true, label: true },
          },
        },
      });

      return subs.map((s) => ({
        ...s,
        source: s.source as "REDEEM" | "MANUAL",
        tryoutTitle: s.tryout?.title || null,
        code: s.code?.code || null,
        codeLabel: s.code?.label || null,
      }));
    } catch (err) {
      console.warn("findAllByUserId query fallback:", err);
      try {
        const basicSubs = await prisma.subscription.findMany({
          where: { userId },
          orderBy: { endsAt: "desc" },
        });
        return basicSubs.map((s) => ({
          ...s,
          source: s.source as "REDEEM" | "MANUAL",
          tryoutTitle: null,
          code: null,
          codeLabel: null,
        }));
      } catch {
        return [];
      }
    }
  }

  async create(data: Omit<SubscriptionEntity, "id" | "createdAt">): Promise<SubscriptionEntity> {
    const sub = await prisma.subscription.create({
      data: {
        userId: data.userId,
        codeId: data.codeId,
        tryoutId: data.tryoutId,
        source: data.source,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        grantedById: data.grantedById,
        note: data.note,
      },
    });
    return {
      ...sub,
      source: sub.source as "REDEEM" | "MANUAL",
    };
  }

  async countActive(now: Date): Promise<number> {
    return await prisma.subscription.count({
      where: { endsAt: { gt: now } },
    });
  }

  async countExpiring(from: Date, to: Date): Promise<number> {
    return await prisma.subscription.count({
      where: { endsAt: { gt: from, lte: to } },
    });
  }
}
