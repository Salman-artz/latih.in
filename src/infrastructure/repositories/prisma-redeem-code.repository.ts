import { prisma } from "@/lib/db";
import { IRedeemCodeRepository } from "@/core/domain/repositories/redeem-code.repository.interface";
import { RedeemCodeEntity } from "@/core/domain/entities/redeem-code.entity";
import { Prisma } from "@prisma/client";

export class PrismaRedeemCodeRepository implements IRedeemCodeRepository {
  async findByCode(code: string): Promise<RedeemCodeEntity | null> {
    return await prisma.redeemCode.findUnique({ where: { code } });
  }

  async findForAdmin(params: {
    page: number;
    limit: number;
    status: string;
    search: string;
    now: Date;
  }): Promise<{
    codes: (RedeemCodeEntity & {
      status: string;
      usedBy: { name: string; email: string } | null;
    })[];
    total: number;
  }> {
    const where: Prisma.RedeemCodeWhereInput = {};

    if (params.search) {
      where.OR = [
        { code: { contains: params.search.toUpperCase() } },
        { label: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.status === "AVAILABLE") {
      where.isUsed = false;
      where.revokedAt = null;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: params.now } }];
    } else if (params.status === "USED") {
      where.isUsed = true;
    } else if (params.status === "REVOKED") {
      where.revokedAt = { not: null };
    } else if (params.status === "EXPIRED") {
      where.isUsed = false;
      where.revokedAt = null;
      where.expiresAt = { lte: params.now };
    }

    const [total, codes] = await Promise.all([
      prisma.redeemCode.count({ where }),
      prisma.redeemCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          subscription: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    const formatted = codes.map((c) => {
      let statusStr = "AVAILABLE";
      if (c.revokedAt) statusStr = "REVOKED";
      else if (c.isUsed) statusStr = "USED";
      else if (c.expiresAt && c.expiresAt <= params.now) statusStr = "EXPIRED";

      return {
        ...c,
        status: statusStr,
        usedBy: c.subscription?.user ? { name: c.subscription.user.name, email: c.subscription.user.email } : null,
      };
    });

    return { codes: formatted, total };
  }

  async createMany(codes: { code: string; durationDays: number; label?: string | null; expiresAt?: Date | null; createdById: string }[]): Promise<void> {
    await prisma.redeemCode.createMany({
      data: codes,
    });
  }

  async revoke(id: string, adminId: string): Promise<RedeemCodeEntity> {
    return await prisma.redeemCode.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedById: adminId,
      },
    });
  }

  async countAll(): Promise<number> {
    return await prisma.redeemCode.count();
  }

  async countUsed(): Promise<number> {
    return await prisma.redeemCode.count({ where: { isUsed: true } });
  }

  async countRevoked(): Promise<number> {
    return await prisma.redeemCode.count({ where: { revokedAt: { not: null } } });
  }

  async countAvailable(now: Date): Promise<number> {
    return await prisma.redeemCode.count({
      where: {
        isUsed: false,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  }
}
