import { describe, it, expect } from "vitest";
import { jobAnalysisSchema, storedAnalysisSchema } from "./analysis";

const VALID_ANALYSIS = {
  meta: {
    title: "Senior Backend Engineer",
    company: "Acme Inc.",
    location: "Paris",
    remote: "hybrid",
    contractType: "CDI",
    salaryRange: { min: 55000, max: 75000, currency: "EUR" },
    seniorityAnnounced: "senior",
  },
  skills: {
    required: [{ name: "Go", evidence: "5+ years of Go" }],
    niceToHave: [{ name: "Kubernetes", evidence: "Bonus: Kubernetes" }],
    impliedButUnstated: [{ name: "Git", reason: "Universal for engineers" }],
  },
  realityCheck: {
    redFlags: [
      {
        phrase: "fast-paced environment",
        translation: "expect overtime",
        severity: "medium",
      },
    ],
    greenFlags: [{ phrase: "Stock options", why: "alignment incentive" }],
    seniorityRealVsAnnounced: {
      real: "senior",
      reasoning: "Scope and years required match the announced level.",
    },
  },
  questionsToAsk: [
    "What does on-call rotation look like?",
    "Why is this role open?",
  ],
};

describe("jobAnalysisSchema", () => {
  it("accepts a fully populated valid analysis", () => {
    const result = jobAnalysisSchema.safeParse(VALID_ANALYSIS);
    expect(result.success).toBe(true);
  });

  it("accepts an analysis without optional verdict and company fields (back-compat)", () => {
    const result = jobAnalysisSchema.safeParse(VALID_ANALYSIS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.verdict).toBeUndefined();
      expect(result.data.company).toBeUndefined();
    }
  });

  it("accepts a verdict when provided", () => {
    const withVerdict = {
      ...VALID_ANALYSIS,
      verdict: { score: 7, sentiment: "apply", oneLiner: "Solid posting" },
    };
    const result = jobAnalysisSchema.safeParse(withVerdict);
    expect(result.success).toBe(true);
  });

  it("rejects when required meta fields are missing", () => {
    const broken = { ...VALID_ANALYSIS, meta: { title: "x" } };
    const result = jobAnalysisSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid sentiment enum", () => {
    const broken = {
      ...VALID_ANALYSIS,
      verdict: { score: 7, sentiment: "wrong", oneLiner: "..." },
    };
    const result = jobAnalysisSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });
});

describe("storedAnalysisSchema", () => {
  it("accepts a stored entry wrapping a valid analysis", () => {
    const stored = {
      id: "abc",
      createdAt: 1_700_000_000_000,
      jobText: "raw posting text",
      analysis: VALID_ANALYSIS,
    };
    const result = storedAnalysisSchema.safeParse(stored);
    expect(result.success).toBe(true);
  });
});
