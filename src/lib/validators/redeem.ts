import { z } from "zod";

export function normalizeRedeemCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[-\s]/g, "");
}

export const redeemSchema = z.object({
  code: z
    .string()
    .min(1, "Kode redeem wajib diisi")
    .transform(normalizeRedeemCode)
    .pipe(
      z
        .string()
        .min(8, "Kode redeem minimal 8 karakter")
        .max(16, "Kode redeem maksimal 16 karakter")
        .regex(/^[A-Z0-9]+$/, "Kode redeem hanya boleh berisi huruf dan angka")
    ),
});

export type RedeemInput = z.infer<typeof redeemSchema>;
