import { getUserSubscriptionUseCase } from "@/core/container";

export { type UserSubscriptionStatus } from "@/services/subscription.types";

export async function getUserSubscription(userId: string) {
  return await getUserSubscriptionUseCase.execute(userId);
}
