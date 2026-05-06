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

const salarySchema = z
  .object({
    min: z.number(),
    max: z.number(),
    currency: z.string(),
  })
  .nullable();

export const jobAnalysisSchema = z.object({
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

export const storedAnalysisSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  jobText: z.string(),
  analysis: jobAnalysisSchema,
});

export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;
