import { prisma } from "@/lib/db";

export interface UserSubscriptionStatus {
  isActive: boolean;
  subscription: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    daysLeft: number;
    isExpiringSoon: boolean;
  } | null;
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionStatus> {
  const now = new Date();

  // Cari langganan dengan endsAt terbesar yang lebih besar dari waktu sekarang
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      endsAt: {
        gt: now,
      },
    },
    orderBy: {
      endsAt: "desc",
    },
  });

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
