import { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { IRedeemCodeRepository } from "@/core/domain/repositories/redeem-code.repository.interface";
import { ITryoutRepository } from "@/core/domain/repositories/tryout.repository.interface";
import { generateRandomCodeString } from "@/services/admin";
import { AppError } from "@/lib/errors";

export class GetAdminStatsUseCase {
  constructor(
    private userRepo: IUserRepository,
    private subRepo: ISubscriptionRepository,
    private codeRepo: IRedeemCodeRepository,
    private tryoutRepo: ITryoutRepository
  ) {}

  async execute() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      activeSubscriptions,
      expiringSubscriptions,
      totalCodes,
      availableCodes,
      usedCodes,
      revokedCodes,
      tryoutStats,
    ] = await Promise.all([
      this.userRepo.countAll().catch(() => 0),
      this.userRepo.countCreatedAfter(sevenDaysAgo).catch(() => 0),
      this.subRepo.countActive(now).catch(() => 0),
      this.subRepo.countExpiring(now, sevenDaysLater).catch(() => 0),
      this.codeRepo.countAll().catch(() => 0),
      this.codeRepo.countAvailable(now).catch(() => 0),
      this.codeRepo.countUsed().catch(() => 0),
      this.codeRepo.countRevoked().catch(() => 0),
      this.tryoutRepo.getSubmittedAttemptsStats().catch(() => ({ count: 0, avgScore: 0 })),
    ]);

    return {
      totalUsers,
      newUsersLast7Days,
      activeSubscriptions,
      expiringSubscriptions,
      totalCodes,
      availableCodes,
      usedCodes,
      revokedCodes,
      totalAttempts: tryoutStats.count,
      avgScore: tryoutStats.avgScore,
    };
  }
}

export class GenerateRedeemCodesUseCase {
  constructor(private codeRepo: IRedeemCodeRepository) {}

  async execute(params: {
    adminId: string;
    count: number;
    durationDays: number;
    maxUses?: number;
    label?: string;
    tryoutId?: string | null;
    expiresAt?: Date | null;
  }) {
    const generatedCodes: string[] = [];
    const maxAttempts = params.count * 5;
    let attempts = 0;

    while (generatedCodes.length < params.count && attempts < maxAttempts) {
      attempts++;
      const candidate = generateRandomCodeString(12);
      if (generatedCodes.includes(candidate)) continue;

      const exists = await this.codeRepo.findByCode(candidate);
      if (!exists) {
        generatedCodes.push(candidate);
      }
    }

    if (generatedCodes.length < params.count) {
      throw new AppError("Gagal menghasilkan seluruh kode unik, silakan coba lagi", 500, "GENERATION_FAILED");
    }

    await this.codeRepo.createMany(
      generatedCodes.map((code) => ({
        code,
        durationDays: params.durationDays,
        maxUses: params.maxUses || 1,
        label: params.label || null,
        tryoutId: params.tryoutId || null,
        expiresAt: params.expiresAt || null,
        createdById: params.adminId,
      }))
    );

    return {
      count: generatedCodes.length,
      codes: generatedCodes,
    };
  }
}
