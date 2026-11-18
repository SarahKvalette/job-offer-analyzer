import { describe, it, expect } from "vitest";
import {
  isSourced,
  normalizeForMatch,
  verifyAnalysisEvidence,
} from "./verify-evidence";
import type { JobAnalysis } from "@/lib/schemas/analysis";

describe("normalizeForMatch", () => {
  it("folds accents, case and whitespace", () => {
    expect(normalizeForMatch("Expérience   SENIOR")).toBe("experience senior");
  });
});

describe("isSourced — French typography tolerance", () => {
  // Real French typography: narrow no-break space before the colon, no-break
  // space as the thousands separator, curly apostrophe, em dash, guillemets.
  const source =
    "Rémunération : 45 000 € selon profil. Vous rejoignez l’équipe produit — un vrai « plus ».";

  it("matches across a non-breaking space before the colon", () => {
    // quote uses a regular space, source a narrow non-breaking space
    expect(isSourced("Rémunération : 45 000 €", source)).toBe(true);
  });

  it("matches a straight apostrophe against a curly one", () => {
    expect(isSourced("l'équipe produit", source)).toBe(true);
  });

  it("tolerates missing accents", () => {
    expect(isSourced("Remuneration", source)).toBe(true);
  });

  it("matches across an em dash vs hyphen and « » guillemets", () => {
    expect(isSourced("produit - un vrai \" plus \"", source)).toBe(true);
  });

  it("rejects a quote that is genuinely absent", () => {
    expect(isSourced("télétravail intégral", source)).toBe(false);
  });

  it("rejects an empty quote", () => {
    expect(isSourced("   ", source)).toBe(false);
  });
});

describe("verifyAnalysisEvidence", () => {
  const jobText =
    "Senior Designer polyvalent. Maîtrise de Figma. Rémunération : selon profil.";

  const analysis = {
    verdict: { score: 3, sentiment: "avoid", oneLiner: "x" },
    company: {
      sizeEstimate: "startup",
      industry: null,
      stage: null,
      funding: null,
      techStack: [],
      perks: [],
      cultureSignals: [
        { phrase: "polyvalent", meaning: "cumul de rôles" },
        { phrase: "esprit startup", meaning: "non présent" },
      ],
    },
    meta: {
      title: "Designer",
      company: null,
      location: null,
      remote: "unknown",
      contractType: null,
      salaryRange: null,
      seniorityAnnounced: "senior",
    },
    skills: {
      required: [{ name: "Figma", evidence: "Maîtrise de Figma" }],
      niceToHave: [],
      impliedButUnstated: [],
    },
    realityCheck: {
      redFlags: [
        {
          phrase: "Senior Designer polyvalent",
          translation: "décalage",
          severity: "high",
        },
        {
          phrase: "urgence ASAP inventée",
          translation: "non présent",
          severity: "medium",
        },
      ],
      greenFlags: [],
      seniorityRealVsAnnounced: { real: "junior", reasoning: "x" },
    },
    questionsToAsk: [],
  } as unknown as JobAnalysis;

  it("flags only the genuinely unsourced quotes", () => {
    const report = verifyAnalysisEvidence(analysis, jobText);
    expect(report.total).toBe(5);
    expect(report.sourced).toBe(3);
    const unsourcedQuotes = report.unsourced.map((u) => u.quote).sort();
    expect(unsourcedQuotes).toEqual(
      ["esprit startup", "urgence ASAP inventée"].sort()
    );
    // One of the unsourced is a red flag.
    expect(report.unsourcedFlagCount).toBe(1);
  });
});
