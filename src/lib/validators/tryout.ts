import { z } from "zod";

export const saveAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        statementId: z.string().min(1, "ID pernyataan wajib diisi"),
        answer: z.boolean(),
      })
    )
    .min(1, "Minimal satu jawaban dikirim"),
});

export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;

export const recordViolationSchema = z.object({
  type: z.enum([
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "EXIT_FULLSCREEN",
    "SPLIT_SCREEN",
    "DEVTOOLS_OR_PRINT",
    "COPY_ATTEMPT",
  ]),
  detail: z.string().max(500).optional(),
});

export type RecordViolationInput = z.infer<typeof recordViolationSchema>;
