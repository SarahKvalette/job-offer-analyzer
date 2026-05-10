import type { JobAnalysis } from "@/lib/schemas/analysis";
import type { ProfileWeights, UserProfile } from "@/lib/schemas/profile";
import { isProfileEmpty } from "@/lib/schemas/profile";
import { labelFor } from "@/lib/data/tech-stacks";

/**
 * Six dimensions, each 0-1, weighted by the user profile to produce an
 * overall 0-10 score. Pure: same inputs → same outputs, no LLM call,
 * no I/O, fully unit-testable.
 */
export type FitDimension =
  | "salary"
  | "remote"
  | "stack"
  | "growth"
  | "balance"
  | "culture";

export interface FitBreakdown {
  /** Sub-scores in [0, 1]. */
  salary: number;
  remote: number;
  stack: number;
  growth: number;
  balance: number;
  culture: number;
}

export interface FitScore {
  /** Overall score on a 0-10 scale, integer. */
  overall: number;
  breakdown: FitBreakdown;
  /** Reasons this offer scores high — surfaced as bullet points. */
  strengths: string[];
  /** Reasons this offer scores low — surfaced as bullet points. */
  frictions: string[];
  /** True when the user profile is empty — UI should prompt to set it up. */
  profileEmpty: boolean;
}

const DIMENSIONS: FitDimension[] = [
  "salary",
  "remote",
  "stack",
  "growth",
  "balance",
  "culture",
];

/**
 * Normalise the raw 0-100 weights into a probability vector summing to 1.
 * Falls back to uniform weights when all sliders are 0.
 */
function normaliseWeights(weights: ProfileWeights): Record<FitDimension, number> {
  const total =
    weights.salary +
    weights.remote +
    weights.stack +
    weights.growth +
    weights.balance +
    weights.culture;
  if (total === 0) {
    const uniform = 1 / DIMENSIONS.length;
    return {
      salary: uniform,
      remote: uniform,
      stack: uniform,
      growth: uniform,
      balance: uniform,
      culture: uniform,
    };
  }
  return {
    salary: weights.salary / total,
    remote: weights.remote / total,
    stack: weights.stack / total,
    growth: weights.growth / total,
    balance: weights.balance / total,
    culture: weights.culture / total,
  };
}

// ── Per-dimension scoring (each returns [0, 1] + a contextual note) ────

function scoreSalary(
  analysis: JobAnalysis,
  profile: UserProfile
): { score: number; note?: string } {
  const offered = analysis.meta.salaryRange;
  const min = profile.minSalary;

  if (!min) return { score: 0.5 }; // user didn't set a min → neutral
  if (!offered) return { score: 0.2, note: "Salary not disclosed in posting" };
  if (offered.currency !== min.currency) {
    return { score: 0.5, note: "Different currencies — can't compare" };
  }

  // Normalise to yearly for the user min — assume offered is yearly.
  const userYearly =
    min.period === "year"
      ? min.amount
      : min.period === "month"
      ? min.amount * 12
      : min.amount * 220; // working days
  const offeredMid = (offered.min + offered.max) / 2;

  if (offered.max < userYearly) {
    return {
      score: 0,
      note: `Top of band (${offered.max}) below your minimum (${userYearly})`,
    };
  }
  if (offered.min >= userYearly * 1.2) {
    return { score: 1, note: "Comfortably above your minimum" };
  }
  if (offered.min >= userYearly) {
    return { score: 0.85, note: "Bottom of band meets your minimum" };
  }
  // Min below user, but max above → partial fit based on midpoint position
  const ratio = offeredMid / userYearly;
  return {
    score: Math.max(0, Math.min(1, ratio - 0.5)),
    note: "Mid-band straddles your minimum",
  };
}

function scoreRemote(
  analysis: JobAnalysis,
  profile: UserProfile
): { score: number; note?: string } {
  const pref = profile.remotePreference;
  const offered = analysis.meta.remote;
  if (pref === "any") return { score: 0.7 };
  if (offered === "unknown") {
    return { score: 0.4, note: "Posting doesn't state remote policy" };
  }
  if (pref === "full" && offered === "full") return { score: 1 };
  if (pref === "full" && offered === "hybrid") return { score: 0.4, note: "You want full remote — hybrid won't match" };
  if (pref === "full" && offered === "onsite") return { score: 0, note: "Full-remote / onsite mismatch" };
  if (pref === "hybrid" && offered === "hybrid") return { score: 1 };
  if (pref === "hybrid" && offered === "full") return { score: 0.85, note: "More flexibility than your preference" };
  if (pref === "hybrid" && offered === "onsite") return { score: 0.3, note: "Onsite-only doesn't match hybrid preference" };
  if (pref === "onsite" && offered === "onsite") return { score: 1 };
  if (pref === "onsite" && offered === "hybrid") return { score: 0.7, note: "Hybrid acceptable for an onsite preference" };
  if (pref === "onsite" && offered === "full") return { score: 0.5, note: "Full-remote when you want onsite" };
  return { score: 0.5 };
}

function scoreStack(
  analysis: JobAnalysis,
  profile: UserProfile
): { score: number; note?: string; matchCount: number; totalRequired: number } {
  if (profile.stack.length === 0) {
    return { score: 0.5, matchCount: 0, totalRequired: 0 };
  }
  const required = analysis.skills.required;
  if (required.length === 0) {
    return { score: 0.7, matchCount: 0, totalRequired: 0 };
  }

  // Build a normalised set of the user's stack labels for matching.
  const userLabels = new Set(
    profile.stack.map((id) => labelFor(id).toLowerCase())
  );

  let matches = 0;
  for (const skill of required) {
    const name = skill.name.toLowerCase();
    for (const label of userLabels) {
      if (name === label || name.includes(label) || label.includes(name)) {
        matches++;
        break;
      }
    }
  }

  const ratio = matches / required.length;
  return {
    score: Math.max(0, Math.min(1, ratio)),
    matchCount: matches,
    totalRequired: required.length,
    note:
      ratio === 1
        ? "All required skills covered by your stack"
        : ratio === 0
        ? "None of your stack matches required skills"
        : `${matches}/${required.length} required skills in your stack`,
  };
}

function scoreGrowth(
  analysis: JobAnalysis
): { score: number; note?: string } {
  // Heuristics: company size + stage. Startups + scaleups score higher
  // for growth-oriented candidates. Enterprise scores lower.
  const company = analysis.company;
  if (!company) return { score: 0.5 };

  const sizeScore = {
    startup: 1,
    scaleup: 0.85,
    midsize: 0.55,
    enterprise: 0.4,
    unknown: 0.5,
  }[company.sizeEstimate];

  const note =
    company.sizeEstimate === "startup" || company.sizeEstimate === "scaleup"
      ? "Early-stage company — high growth potential"
      : company.sizeEstimate === "enterprise"
      ? "Established company — slower individual growth"
      : undefined;

  return { score: sizeScore, note };
}

function scoreBalance(analysis: JobAnalysis): { score: number; note?: string } {
  // Heuristic: red flags severity weighted by count.
  const reds = analysis.realityCheck.redFlags;
  const greens = analysis.realityCheck.greenFlags;

  const redWeight = reds.reduce((acc, f) => {
    if (f.severity === "high") return acc + 0.3;
    if (f.severity === "medium") return acc + 0.15;
    return acc + 0.05;
  }, 0);

  const greenBonus = Math.min(0.2, greens.length * 0.05);

  const score = Math.max(0, Math.min(1, 1 - redWeight + greenBonus));

  let note: string | undefined;
  if (reds.length === 0 && greens.length === 0) {
    note = undefined;
  } else if (redWeight >= 0.5) {
    note = `${reds.length} red flag(s) suggest rough work-life balance`;
  } else if (greens.length >= 3) {
    note = `${greens.length} green flag(s) suggest healthy practices`;
  }

  return { score, note };
}

function scoreCulture(
  analysis: JobAnalysis,
  profile: UserProfile
): { score: number; note?: string; brokenDealBreakers: string[] } {
  const greenCount = analysis.realityCheck.greenFlags.length;
  const cultureSignals = analysis.company?.cultureSignals ?? [];

  // Base from green flags + culture signals
  let base = 0.5;
  base += Math.min(0.3, greenCount * 0.07);
  base += Math.min(0.2, cultureSignals.length * 0.05);

  // Deal-breaker check: each match drops the score significantly.
  const haystack = (
    analysis.realityCheck.redFlags.map((f) => f.phrase + " " + f.translation).join(" ") +
    " " +
    (analysis.company?.cultureSignals.map((s) => s.phrase).join(" ") ?? "")
  ).toLowerCase();

  const broken: string[] = [];
  for (const db of profile.dealBreakers) {
    const dbLower = db.toLowerCase().trim();
    if (dbLower.length > 0 && haystack.includes(dbLower)) {
      broken.push(db);
    }
  }
  base -= broken.length * 0.4;

  const score = Math.max(0, Math.min(1, base));
  let note: string | undefined;
  if (broken.length > 0) {
    note = `Posting touches deal-breaker: "${broken[0]}"`;
  } else if (greenCount + cultureSignals.length >= 4) {
    note = "Strong cultural signals";
  }

  return { score, note, brokenDealBreakers: broken };
}

// ── Public API ─────────────────────────────────────────────────────────

export function computeFitScore(
  analysis: JobAnalysis,
  profile: UserProfile
): FitScore {
  const profileEmpty = isProfileEmpty(profile);
  const weights = normaliseWeights(profile.weights);

  const salary = scoreSalary(analysis, profile);
  const remote = scoreRemote(analysis, profile);
  const stack = scoreStack(analysis, profile);
  const growth = scoreGrowth(analysis);
  const balance = scoreBalance(analysis);
  const culture = scoreCulture(analysis, profile);

  const breakdown: FitBreakdown = {
    salary: salary.score,
    remote: remote.score,
    stack: stack.score,
    growth: growth.score,
    balance: balance.score,
    culture: culture.score,
  };

  const weighted =
    breakdown.salary * weights.salary +
    breakdown.remote * weights.remote +
    breakdown.stack * weights.stack +
    breakdown.growth * weights.growth +
    breakdown.balance * weights.balance +
    breakdown.culture * weights.culture;

  const overall = Math.round(weighted * 10);

  // Build strengths / frictions from the contextual notes.
  const strengths: string[] = [];
  const frictions: string[] = [];

  const STRONG_THRESHOLD = 0.7;
  const WEAK_THRESHOLD = 0.4;

  function bucket(
    score: number,
    note: string | undefined,
    label: string
  ): void {
    if (!note) return;
    if (score >= STRONG_THRESHOLD) strengths.push(`${label} — ${note}`);
    else if (score < WEAK_THRESHOLD) frictions.push(`${label} — ${note}`);
  }

  bucket(salary.score, salary.note, "Compensation");
  bucket(remote.score, remote.note, "Remote");
  bucket(stack.score, stack.note, "Stack");
  bucket(growth.score, growth.note, "Growth");
  bucket(balance.score, balance.note, "Balance");
  bucket(culture.score, culture.note, "Culture");

  // Always surface broken deal-breakers as frictions, even if culture
  // score didn't qualify.
  for (const db of culture.brokenDealBreakers) {
    const line = `Deal-breaker triggered: "${db}"`;
    if (!frictions.includes(line)) frictions.push(line);
  }

  return {
    overall: Math.max(0, Math.min(10, overall)),
    breakdown,
    strengths,
    frictions,
    profileEmpty,
  };
}

/**
 * Return a verdict label for a fit score, useful for headlines like
 * "Strong fit · 8/10".
 */
export function fitLabel(score: number): "strong" | "ok" | "weak" {
  if (score >= 7) return "strong";
  if (score >= 4) return "ok";
  return "weak";
}
