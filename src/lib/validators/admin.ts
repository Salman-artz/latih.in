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

export const materialSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter").trim(),
  description: z.string().min(5, "Deskripsi minimal 5 karakter").trim(),
  youtubeUrl: z
    .string()
    .min(1, "URL atau ID YouTube wajib diisi")
    .refine((val) => extractYoutubeId(val) !== null, {
      message: "Format URL atau ID video YouTube tidak valid",
    }),
  order: z.number().int().min(1, "Urutan minimal 1").default(1),
});

export type GenerateCodesInput = z.infer<typeof generateCodesSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
