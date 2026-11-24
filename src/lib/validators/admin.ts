import { z } from "zod";

/**
 * Regex & parser untuk ekstrak YouTube Video ID dari URL atau ID langsung
 */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  // Pola ID YouTube standar 11 karakter alfanumerik + _ -
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Pola URL youtube: watch?v=ID, youtu.be/ID, embed/ID, shorts/ID, youtube-nocookie.com
  const patterns = [
    /(?:youtu\.be\/|(?:youtube\.com|youtube-nocookie\.com)\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export const generateCodesSchema = z.object({
  count: z.number().int().min(1, "Minimal 1 kode").max(100, "Maksimal 100 kode per batch").default(1),
  durationDays: z.number().int().min(1, "Durasi minimal 1 hari").max(730, "Durasi maksimal 730 hari").default(30),
  maxUses: z.number().int().min(1, "Minimal kuota 1 pengguna").max(1000, "Maksimal kuota 1000 pengguna").default(1),
  label: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateRedeemCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .max(50, "Kode maksimal 50 karakter")
    .regex(/^[A-Za-z0-9_-]+$/, "Kode hanya boleh huruf, angka, tanda hubung (-), dan garis bawah (_)")
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  durationDays: z.number().int().min(1, "Durasi minimal 1 hari").max(730, "Durasi maksimal 730 hari").optional(),
  maxUses: z.number().int().min(1, "Minimal kuota 1 pengguna").max(10000, "Maksimal kuota 10.000 pengguna").optional(),
  label: z.string().max(100, "Label maksimal 100 karakter").optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const materialSchema = z
  .object({
    title: z.string().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter").trim(),
    description: z.string().min(5, "Deskripsi minimal 5 karakter").trim(),
    videoType: z.enum(["YOUTUBE", "CLOUDINARY"]).default("YOUTUBE"),
    youtubeUrl: z.string().optional().nullable(),
    videoUrl: z.string().url("URL video tidak valid").optional().nullable(),
    order: z.number().int().min(1, "Urutan minimal 1").default(1),
  })
  .refine(
    (data) => {
      if (data.videoType === "YOUTUBE") {
        return Boolean(data.youtubeUrl && extractYoutubeId(data.youtubeUrl) !== null);
      }
      if (data.videoType === "CLOUDINARY") {
        return Boolean(data.videoUrl && data.videoUrl.trim().length > 0);
      }
      return true;
    },
    {
      message: "Tautan video (YouTube atau URL Video Cloudinary) wajib valid",
      path: ["videoUrl"],
    }
  );

export const createTryoutSchema = z.object({
  title: z.string().min(3, "Judul tryout minimal 3 karakter").max(100, "Judul tryout maksimal 100 karakter").trim(),
  durationMinutes: z.number().int().min(1, "Durasi minimal 1 menit").max(180, "Durasi maksimal 180 menit").default(20),
  status: z.enum(["PUBLISHED", "DRAFT"]).default("PUBLISHED"),
});

export const updateTryoutSchema = z.object({
  title: z.string().min(3, "Judul tryout minimal 3 karakter").max(100, "Judul tryout maksimal 100 karakter").trim().optional(),
  durationMinutes: z.number().int().min(1, "Durasi minimal 1 menit").max(180, "Durasi maksimal 180 menit").optional(),
  status: z.enum(["PUBLISHED", "DRAFT"]).optional(),
});

export const statementInputSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(1).default(1),
  text: z.string().min(1, "Teks pernyataan wajib diisi").trim(),
  isTrue: z.boolean(),
  explanation: z.string().min(1, "Pembahasan kunci jawaban wajib diisi").trim(),
});

export const questionInputSchema = z.object({
  order: z.number().int().min(1).default(1),
  stem: z.string().min(5, "Teks soal / stimulus bacaan minimal 5 karakter").trim(),
  statements: z.array(statementInputSchema).min(1, "Minimal harus ada 1 pernyataan").max(10, "Maksimal 10 pernyataan per soal"),
});

export type GenerateCodesInput = z.infer<typeof generateCodesSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type CreateTryoutInput = z.infer<typeof createTryoutSchema>;
export type UpdateTryoutInput = z.infer<typeof updateTryoutSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
