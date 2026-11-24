export interface SubscriptionEntity {
  id: string;
  userId: string;
  codeId?: string | null;
  tryoutId?: string | null;
  source: "REDEEM" | "MANUAL";
  startsAt: Date;
  endsAt: Date;
  grantedById?: string | null;
  note?: string | null;
  createdAt: Date;
}

export interface UserSubscriptionPackage {
  id: string;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
  startsAt: Date;
  endsAt: Date;
  daysLeft: number;
  isExpiringSoon: boolean;
  isActive: boolean;
  source?: "REDEEM" | "MANUAL";
  code?: string | null;
  codeLabel?: string | null;
}

export interface SubscriptionStatusInfo {
  isActive: boolean;
  subscription: {
    id: string;
    tryoutId?: string | null;
    startsAt: Date;
    endsAt: Date;
    daysLeft: number;
    isExpiringSoon: boolean;
  } | null;
  packages?: UserSubscriptionPackage[];
}
