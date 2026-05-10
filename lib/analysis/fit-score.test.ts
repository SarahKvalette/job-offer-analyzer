import { describe, it, expect } from "vitest";
import { computeFitScore, fitLabel } from "./fit-score";
import { DEFAULT_PROFILE, type UserProfile } from "@/lib/schemas/profile";
import type { JobAnalysis } from "@/lib/schemas/analysis";

const baseAnalysis: JobAnalysis = {
  meta: {
    title: "Senior Backend Engineer",
    company: "Acme",
    location: "Paris",
    remote: "hybrid",
    contractType: "CDI",
    salaryRange: { min: 60000, max: 75000, currency: "EUR" },
    seniorityAnnounced: "senior",
  },
  skills: {
    required: [
      { name: "TypeScript", evidence: "TypeScript" },
      { name: "Node.js", evidence: "Node.js" },
      { name: "PostgreSQL", evidence: "Postgres" },
    ],
    niceToHave: [],
    impliedButUnstated: [],
  },
  realityCheck: {
    redFlags: [],
    greenFlags: [
      { phrase: "Stock options", why: "alignment" },
      { phrase: "4-day week", why: "balance" },
    ],
    seniorityRealVsAnnounced: { real: "senior", reasoning: "ok" },
  },
  questionsToAsk: [],
  company: {
    sizeEstimate: "scaleup",
    industry: "Fintech",
    stage: "Series B",
    funding: null,
    techStack: ["TypeScript", "Node.js", "PostgreSQL"],
    perks: ["Stock options", "4-day week"],
    cultureSignals: [],
  },
};

const filledProfile: UserProfile = {
  ...DEFAULT_PROFILE,
  stack: ["language:typescript", "backend:nodejs", "data:postgresql"],
  yearsExperience: 7,
  minSalary: { amount: 55000, currency: "EUR", period: "year" },
  remotePreference: "hybrid",
  location: "Paris",
  acceptedZones: [],
  languages: ["fr", "en"],
  dealBreakers: [],
  weights: {
    salary: 80,
    remote: 60,
    stack: 70,
    growth: 50,
    balance: 80,
    culture: 50,
  },
};

describe("computeFitScore — overall behaviour", () => {
  it("returns profileEmpty=true for the default profile", () => {
    const out = computeFitScore(baseAnalysis, DEFAULT_PROFILE);
    expect(out.profileEmpty).toBe(true);
  });

  it("returns profileEmpty=false when profile has any field set", () => {
    const out = computeFitScore(baseAnalysis, filledProfile);
    expect(out.profileEmpty).toBe(false);
  });

  it("clamps the overall score to [0, 10]", () => {
    const out = computeFitScore(baseAnalysis, filledProfile);
    expect(out.overall).toBeGreaterThanOrEqual(0);
    expect(out.overall).toBeLessThanOrEqual(10);
  });

  it("is deterministic — same inputs → same outputs", () => {
    const a = computeFitScore(baseAnalysis, filledProfile);
    const b = computeFitScore(baseAnalysis, filledProfile);
    expect(a).toEqual(b);
  });
});

describe("computeFitScore — salary dimension", () => {
  it("scores 1 when offered band sits comfortably above the user min", () => {
    const profile = {
      ...filledProfile,
      minSalary: { amount: 40000, currency: "EUR" as const, period: "year" as const },
    };
    const out = computeFitScore(baseAnalysis, profile);
    expect(out.breakdown.salary).toBe(1);
  });

  it("scores 0 when offered top is below the user min", () => {
    const profile = {
      ...filledProfile,
      minSalary: { amount: 100000, currency: "EUR" as const, period: "year" as const },
    };
    const out = computeFitScore(baseAnalysis, profile);
    expect(out.breakdown.salary).toBe(0);
    expect(out.frictions.some((f) => f.startsWith("Compensation"))).toBe(true);
  });

  it("returns neutral 0.5 when the user has no minSalary set", () => {
    const profile = { ...filledProfile, minSalary: null };
    const out = computeFitScore(baseAnalysis, profile);
    expect(out.breakdown.salary).toBe(0.5);
  });

  it("flags missing salary as a low score", () => {
    const analysis = {
      ...baseAnalysis,
      meta: { ...baseAnalysis.meta, salaryRange: null },
    };
    const out = computeFitScore(analysis, filledProfile);
    expect(out.breakdown.salary).toBeLessThan(0.5);
  });
});

describe("computeFitScore — remote dimension", () => {
  it("scores 1 when preference matches offered exactly", () => {
    const out = computeFitScore(baseAnalysis, filledProfile); // hybrid + hybrid
    expect(out.breakdown.remote).toBe(1);
  });

  it("scores 0 on full-remote vs onsite mismatch", () => {
    const profile = { ...filledProfile, remotePreference: "full" as const };
    const analysis = {
      ...baseAnalysis,
      meta: { ...baseAnalysis.meta, remote: "onsite" as const },
    };
    const out = computeFitScore(analysis, profile);
    expect(out.breakdown.remote).toBe(0);
  });

  it("returns 0.7 when user has no preference (any)", () => {
    const profile = { ...filledProfile, remotePreference: "any" as const };
    const out = computeFitScore(baseAnalysis, profile);
    expect(out.breakdown.remote).toBe(0.7);
  });
});

describe("computeFitScore — stack dimension", () => {
  it("scores 1 when all required skills are in the user stack", () => {
    const out = computeFitScore(baseAnalysis, filledProfile);
    expect(out.breakdown.stack).toBe(1);
  });

  it("scores 0 when no overlap", () => {
    const profile = {
      ...filledProfile,
      stack: ["language:rust", "language:go"],
    };
    const out = computeFitScore(baseAnalysis, profile);
    expect(out.breakdown.stack).toBe(0);
  });

  it("returns neutral 0.5 when user stack is empty", () => {
    const profile = { ...filledProfile, stack: [] };
    const out = computeFitScore(baseAnalysis, profile);
    expect(out.breakdown.stack).toBe(0.5);
  });
});

describe("computeFitScore — culture dimension", () => {
  it("flags a broken deal-breaker as a friction", () => {
    const analysis = {
      ...baseAnalysis,
      realityCheck: {
        ...baseAnalysis.realityCheck,
        redFlags: [
          {
            phrase: "on-call rotation",
            translation: "you'll have to do nights",
            severity: "medium" as const,
          },
        ],
      },
    };
    const profile = { ...filledProfile, dealBreakers: ["on-call rotation"] };
    const out = computeFitScore(analysis, profile);
    expect(out.frictions.some((f) => f.toLowerCase().includes("deal-breaker"))).toBe(true);
    expect(out.breakdown.culture).toBeLessThanOrEqual(0.5);
  });
});

describe("computeFitScore — strengths / frictions", () => {
  it("populates strengths when several dimensions score high", () => {
    const out = computeFitScore(baseAnalysis, filledProfile);
    expect(out.strengths.length).toBeGreaterThan(0);
  });

  it("returns arrays even when nothing notable happens", () => {
    const out = computeFitScore(baseAnalysis, DEFAULT_PROFILE);
    expect(Array.isArray(out.strengths)).toBe(true);
    expect(Array.isArray(out.frictions)).toBe(true);
  });
});

describe("fitLabel", () => {
  it("strong for >= 7", () => {
    expect(fitLabel(7)).toBe("strong");
    expect(fitLabel(10)).toBe("strong");
  });
  it("ok for 4-6", () => {
    expect(fitLabel(4)).toBe("ok");
    expect(fitLabel(6)).toBe("ok");
  });
  it("weak for < 4", () => {
    expect(fitLabel(3)).toBe("weak");
    expect(fitLabel(0)).toBe("weak");
  });
});
