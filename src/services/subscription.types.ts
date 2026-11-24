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

export interface UserSubscriptionStatus {
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
