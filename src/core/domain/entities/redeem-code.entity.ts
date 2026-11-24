export type CodeStatus = "AVAILABLE" | "USED" | "REVOKED" | "EXPIRED";

export interface RedeemCodeEntity {
  id: string;
  code: string;
  durationDays: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date | null;
  label?: string | null;
  isUsed: boolean;
  usedById?: string | null;
  usedAt?: Date | null;
  revokedAt?: Date | null;
  revokedById?: string | null;
  createdById?: string | null;
  createdAt: Date;
}
