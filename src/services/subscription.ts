import { cache } from "react";
import { getUserSubscriptionUseCase } from "@/core/container";

export { type UserSubscriptionStatus } from "@/services/subscription.types";

export const getUserSubscription = cache(async (userId: string) => {
  return await getUserSubscriptionUseCase.execute(userId);
});
