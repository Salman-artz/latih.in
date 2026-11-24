import { SubscriptionEntity } from "../entities/subscription.entity";

export interface ISubscriptionRepository {
  findActiveByUserId(userId: string, now: Date, tryoutId?: string): Promise<SubscriptionEntity | null>;
  findAllByUserId(userId: string): Promise<(SubscriptionEntity & { tryoutTitle?: string | null; code?: string | null; codeLabel?: string | null })[]>;
  create(data: Omit<SubscriptionEntity, "id" | "createdAt">): Promise<SubscriptionEntity>;
  countActive(now: Date): Promise<number>;
  countExpiring(from: Date, to: Date): Promise<number>;
}
