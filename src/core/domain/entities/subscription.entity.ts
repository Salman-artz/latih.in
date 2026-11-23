export interface SubscriptionEntity {
  id: string;
  userId: string;
  codeId?: string | null;
  source: "REDEEM" | "MANUAL";
  startsAt: Date;
  endsAt: Date;
  grantedById?: string | null;
  note?: string | null;
  createdAt: Date;
}

export interface SubscriptionStatusInfo {
  isActive: boolean;
  subscription: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    daysLeft: number;
    isExpiringSoon: boolean;
  } | null;
}
