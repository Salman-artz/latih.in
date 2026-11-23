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
