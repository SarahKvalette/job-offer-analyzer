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
export const CURRENT_STORAGE_VERSION = 2;

export const applicationStatusEnum = z.enum([
  "interested",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ignored",
]);
export type ApplicationStatus = z.infer<typeof applicationStatusEnum>;

export const contactSchema = z.object({
  name: z.string(),
  role: z.string().default(""),
  email: z.string().default(""),
  linkedin: z.string().default(""),
});
export type Contact = z.infer<typeof contactSchema>;

export const nextActionSchema = z.object({
  description: z.string(),
  dueAt: z.number().nullable().default(null),
});
export type NextAction = z.infer<typeof nextActionSchema>;

export const applicationSchema = z.object({
  status: applicationStatusEnum.default("interested"),
  appliedAt: z.number().nullable().default(null),
  lastInteractionAt: z.number(),
  notes: z.string().default(""),
  tags: z.array(z.string()).default([]),
  contacts: z.array(contactSchema).default([]),
  nextAction: nextActionSchema.nullable().default(null),
});
export type Application = z.infer<typeof applicationSchema>;

export const questionStageEnum = z.enum(["rh", "technique", "manager", "final"]);
export type QuestionStage = z.infer<typeof questionStageEnum>;

export const categorizedQuestionsSchema = z.object({
  rh: z.array(z.string()),
  technique: z.array(z.string()),
  manager: z.array(z.string()),
  final: z.array(z.string()),
});
export type CategorizedQuestions = z.infer<typeof categorizedQuestionsSchema>;

export const storedAnalysisSchema = z.object({
  schemaVersion: z.number().optional(),
  id: z.string(),
  createdAt: z.number(),
  jobText: z.string(),
  analysis: jobAnalysisSchema,
  /**
   * Lazy-computed result of the question categorisation tool call.
   * Cached on the stored entry so we don't re-prompt every time the user
   * re-opens the analysis.
   */
  categorizedQuestions: categorizedQuestionsSchema.optional(),
  /**
   * CRM data added in storage v2: status / notes / tags / contacts /
   * next action. Optional for back-compat; the migrate helper stamps a
   * default { status: "interested", lastInteractionAt: createdAt } onto
   * legacy entries during the v1→v2 upgrade.
   */
  application: applicationSchema.optional(),
});

export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;
