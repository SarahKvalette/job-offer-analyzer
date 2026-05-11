import { z } from "zod";

/**
 * Saved-search criteria. Lives in KV (owner-only feature), not in the
 * local profile — the cron reads them server-side.
 */
export const savedSearchSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(80),
  keywords: z.array(z.string()).max(20).default([]),
  excludeKeywords: z.array(z.string()).max(20).default([]),
  remote: z.enum(["any", "only", "no"]).default("any"),
  minSalaryEUR: z.number().min(0).nullable().default(null),
  locations: z.array(z.string()).max(20).default([]),
  sources: z
    .array(z.enum(["remotive", "francetravail"]))
    .min(1)
    .default(["remotive", "francetravail"]),
  createdAt: z.number(),
});
export type SavedSearch = z.infer<typeof savedSearchSchema>;

export const storedOfferSchema = z.object({
  id: z.string(),
  source: z.enum(["remotive", "francetravail"]),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote: z.boolean(),
  salaryText: z.string().nullable(),
  salaryMinEUR: z.number().nullable(),
  salaryMaxEUR: z.number().nullable(),
  url: z.string().url(),
  description: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.number(),
  fetchedAt: z.number(),
  matchedSearchIds: z.array(z.string()),
});
export type StoredOffer = z.infer<typeof storedOfferSchema>;

/**
 * Patch shape for creating / updating a saved search via PATCH. `id`
 * and `createdAt` are server-assigned.
 */
export const savedSearchPatchSchema = savedSearchSchema
  .omit({ id: true, createdAt: true })
  .partial();
export type SavedSearchPatch = z.infer<typeof savedSearchPatchSchema>;
