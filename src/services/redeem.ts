import { redeemCodeUseCase } from "@/core/container";

export async function redeemCode(userId: string, rawCode: string) {
  return await redeemCodeUseCase.execute(userId, rawCode);
}
