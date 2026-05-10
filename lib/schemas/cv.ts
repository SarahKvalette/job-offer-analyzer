import { z } from "zod";

export const CURRENT_CV_VERSION = 1;

export const userCvSchema = z.object({
  schemaVersion: z.number().optional(),
  rawText: z.string().default(""),
  fileName: z.string().optional(),
  parsedAt: z.number().optional(),
});

export type UserCV = z.infer<typeof userCvSchema>;

export const DEFAULT_CV: UserCV = {
  schemaVersion: CURRENT_CV_VERSION,
  rawText: "",
  fileName: undefined,
  parsedAt: undefined,
};

export function isCvEmpty(cv: UserCV): boolean {
  return cv.rawText.trim().length === 0;
}
