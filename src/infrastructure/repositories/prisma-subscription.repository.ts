import { prisma } from "@/lib/db";
import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { SubscriptionEntity } from "@/core/domain/entities/subscription.entity";

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async findActiveByUserId(userId: string, now: Date): Promise<SubscriptionEntity | null> {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        endsAt: { gt: now },
      },
      orderBy: { endsAt: "desc" },
    });
    if (!sub) return null;
    return {
      ...sub,
      source: sub.source as "REDEEM" | "MANUAL",
    };
  }

  async create(data: Omit<SubscriptionEntity, "id" | "createdAt">): Promise<SubscriptionEntity> {
    const sub = await prisma.subscription.create({
      data: {
        userId: data.userId,
        codeId: data.codeId,
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
