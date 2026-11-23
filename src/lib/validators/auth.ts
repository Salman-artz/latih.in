import { z } from "zod";

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
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password harus mengandung kombinasi huruf dan angka"),
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
  newPassword: z
    .string()
    .min(8, "Password baru minimal 8 karakter")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password baru harus mengandung kombinasi huruf dan angka"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
