import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { SubscriptionStatusInfo } from "@/core/domain/entities/subscription.entity";

export class GetUserSubscriptionUseCase {
  constructor(private subRepo: ISubscriptionRepository) {}

  async execute(userId: string): Promise<SubscriptionStatusInfo> {
    const now = new Date();
    const activeSub = await this.subRepo.findActiveByUserId(userId, now);

    if (!activeSub) {
      return {
        isActive: false,
        subscription: null,
      };
    }

    const diffTime = activeSub.endsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

    return {
      isActive: true,
      subscription: {
        id: activeSub.id,
        startsAt: activeSub.startsAt,
        endsAt: activeSub.endsAt,
        daysLeft,
        isExpiringSoon,
      },
    };
  }
}
