import { RedeemCodeEntity } from "../entities/redeem-code.entity";

export interface IRedeemCodeRepository {
  findByCode(code: string): Promise<RedeemCodeEntity | null>;
  findForAdmin(params: {
    page: number;
    limit: number;
    status: string;
    search: string;
    now: Date;
  }): Promise<{
    codes: (RedeemCodeEntity & {
      status: string;
      usedBy: { name: string; email: string } | null;
    })[];
    total: number;
  }>;
  createMany(codes: { code: string; durationDays: number; maxUses?: number; label?: string | null; expiresAt?: Date | null; createdById: string }[]): Promise<void>;
  revoke(id: string, adminId: string): Promise<RedeemCodeEntity>;
  countAll(): Promise<number>;
  countUsed(): Promise<number>;
  countRevoked(): Promise<number>;
  countAvailable(now: Date): Promise<number>;
}
