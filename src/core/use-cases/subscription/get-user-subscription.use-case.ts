import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { SubscriptionStatusInfo } from "@/core/domain/entities/subscription.entity";

export class GetUserSubscriptionUseCase {
  constructor(private subRepo: ISubscriptionRepository) {}

  async execute(userId: string): Promise<SubscriptionStatusInfo> {
    const now = new Date();
    const activeSub = await this.subRepo.findActiveByUserId(userId, now);
    const allSubs = await this.subRepo.findAllByUserId(userId);

    const packages = allSubs.map((s) => {
      const endsAtDate = s.endsAt instanceof Date ? s.endsAt : new Date(s.endsAt);
      const startsAtDate = s.startsAt instanceof Date ? s.startsAt : new Date(s.startsAt);
      const diffTime = endsAtDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
      return {
        id: s.id,
        tryoutId: s.tryoutId,
        tryoutTitle: s.tryoutTitle || (s.tryoutId ? "Paket Tryout Khusus" : "Semua Paket Tryout (Akses Penuh)"),
        startsAt: startsAtDate,
        endsAt: endsAtDate,
        daysLeft,
        isExpiringSoon,
        isActive: endsAtDate > now,
        source: s.source,
        code: s.code,
        codeLabel: s.codeLabel,
      };
    });

    if (!activeSub) {
      return {
        isActive: false,
        subscription: null,
        packages,
      };
    }

    const activeEndsAt = activeSub.endsAt instanceof Date ? activeSub.endsAt : new Date(activeSub.endsAt);
    const activeStartsAt = activeSub.startsAt instanceof Date ? activeSub.startsAt : new Date(activeSub.startsAt);
    const diffTime = activeEndsAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

    return {
      isActive: true,
      subscription: {
        id: activeSub.id,
        tryoutId: activeSub.tryoutId,
        startsAt: activeStartsAt,
        endsAt: activeEndsAt,
        daysLeft,
        isExpiringSoon,
      },
      packages,
    };
  }
}
