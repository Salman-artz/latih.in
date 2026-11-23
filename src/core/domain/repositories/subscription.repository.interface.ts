import { SubscriptionEntity } from "../entities/subscription.entity";

export interface ISubscriptionRepository {
  findActiveByUserId(userId: string, now: Date): Promise<SubscriptionEntity | null>;
  create(data: Omit<SubscriptionEntity, "id" | "createdAt">): Promise<SubscriptionEntity>;
  countActive(now: Date): Promise<number>;
  countExpiring(from: Date, to: Date): Promise<number>;
}
