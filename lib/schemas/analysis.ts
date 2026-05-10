import { z } from "zod";

const seniorityAnnouncedEnum = z.enum([
  "junior",
  "mid",
  "senior",
  "staff",
  "unknown",
]);

const seniorityRealEnum = z.enum(["junior", "mid", "senior", "staff"]);

const remoteEnum = z.enum(["full", "hybrid", "onsite", "unknown"]);

const severityEnum = z.enum(["low", "medium", "high"]);

const sentimentEnum = z.enum(["apply", "caution", "avoid"]);

const verdictSchema = z.object({
  score: z.number().min(0).max(10),
  sentiment: sentimentEnum,
  oneLiner: z.string(),
});

const companySizeEnum = z.enum([
  "startup",
  "scaleup",
  "midsize",
  "enterprise",
  "unknown",
]);

const companyInsightSchema = z.object({
  sizeEstimate: companySizeEnum,
  industry: z.string().nullable(),
  stage: z.string().nullable(),
  funding: z.string().nullable(),
  techStack: z.array(z.string()),
  perks: z.array(z.string()),
  cultureSignals: z.array(
    z.object({
      phrase: z.string(),
      meaning: z.string(),
    })
  ),
});

const salarySchema = z
  .object({
    min: z.number(),
    max: z.number(),
    currency: z.string(),
  })
  .nullable();

export const jobAnalysisSchema = z.object({
  verdict: verdictSchema.optional(),
  company: companyInsightSchema.optional(),
  meta: z.object({
    title: z.string(),
    company: z.string().nullable(),
    location: z.string().nullable(),
    remote: remoteEnum,
    contractType: z.string().nullable(),
    salaryRange: salarySchema,
    seniorityAnnounced: seniorityAnnouncedEnum,
  }),
  skills: z.object({
    required: z.array(
      z.object({
        name: z.string(),
        evidence: z.string(),
      })
    ),
    niceToHave: z.array(
      z.object({
        name: z.string(),
        evidence: z.string(),
      })
    ),
    impliedButUnstated: z.array(
      z.object({
        name: z.string(),
        reason: z.string(),
      })
    ),
  }),
  realityCheck: z.object({
    redFlags: z.array(
      z.object({
        phrase: z.string(),
        translation: z.string(),
        severity: severityEnum,
      })
    ),
    greenFlags: z.array(
      z.object({
        phrase: z.string(),
        why: z.string(),
      })
    ),
    seniorityRealVsAnnounced: z.object({
      real: seniorityRealEnum,
      reasoning: z.string(),
    }),
  }),
  questionsToAsk: z.array(z.string()),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

/**
 * Current storage schema version for entries written to localStorage.
 *
 * Bump when a new required field lands on `StoredAnalysis` and add the
 * matching upgrade step in `lib/storage/migrate.ts`. Optional fields can be
 * added without bumping (e.g. verdict / company today).
 */
export const CURRENT_STORAGE_VERSION = 1;

export const storedAnalysisSchema = z.object({
  schemaVersion: z.number().optional(),
  id: z.string(),
  createdAt: z.number(),
  jobText: z.string(),
  analysis: jobAnalysisSchema,
});

export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;
