import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar (A-Z)")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil (a-z)")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka (0-9)");

/**
 * Helper validasi password untuk sisi client & server
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: "Password minimal 8 karakter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password harus mengandung minimal 1 huruf besar (A-Z)" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password harus mengandung minimal 1 huruf kecil (a-z)" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password harus mengandung minimal 1 angka (0-9)" };
  }
  return { isValid: true };
}

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter")
    .trim(),
  email: z
    .string()
    .email("Format email tidak valid")
    .trim()
    .toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
