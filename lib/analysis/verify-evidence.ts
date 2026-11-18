import type { JobAnalysis } from "@/lib/schemas/analysis";

/**
 * Citation verification, robust to French typography.
 *
 * The model is told to quote verbatim, but real postings mix typographic
 * quirks: non-breaking spaces before « : ; ! ? », curly vs straight
 * apostrophes (l'équipe / l'équipe), en/em dashes, « guillemets », and
 * accents the model sometimes drops. A naive `source.includes(quote)` then
 * fails on a quote that is, to a human, clearly present.
 *
 * `normalizeForMatch` folds all of that away so matching is tolerant, while
 * the UI still displays (and highlights) the model's original quote. A quote
 * that still doesn't match is genuinely unsourced — surfaced as a "non
 * sourcé" signal or used to trigger a single re-analysis.
 */
export function normalizeForMatch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents (é → e)
    .replace(/[‘’ʼ′‵]/g, "'") // curly apostrophes → '
    .replace(/[“”„«»″]/g, '"') // quotes/guillemets → "
    .replace(/[‐-―−]/g, "-") // en/em/figure dashes, minus → -
    .replace(/\s+/g, " ") // collapse all whitespace incl. nbsp / narrow nbsp
    .toLowerCase()
    .trim();
}

/** True when `quote` appears in `source` after French-tolerant normalization. */
export function isSourced(quote: string, source: string): boolean {
  const q = normalizeForMatch(quote);
  if (q.length === 0) return false;
  return normalizeForMatch(source).includes(q);
}

export type EvidenceOrigin =
  | "skill.required"
  | "skill.niceToHave"
  | "redFlag"
  | "greenFlag"
  | "cultureSignal";

export type EvidenceCheck = {
  origin: EvidenceOrigin;
  /** Human label of the item the quote belongs to (skill name, flag, …). */
  label: string;
  quote: string;
  sourced: boolean;
};

export type EvidenceReport = {
  checks: EvidenceCheck[];
  total: number;
  sourced: number;
  unsourced: EvidenceCheck[];
  /** Quotes that fail sourcing on flags specifically — the critical ones. */
  unsourcedFlagCount: number;
};

/**
 * Check every quoted field in an analysis against the posting. The posting is
 * normalized once for efficiency.
 */
export function verifyAnalysisEvidence(
  analysis: JobAnalysis,
  jobText: string
): EvidenceReport {
  const normalizedSource = normalizeForMatch(jobText);
  const sourcedIn = (quote: string): boolean => {
    const q = normalizeForMatch(quote);
    return q.length > 0 && normalizedSource.includes(q);
  };

  const checks: EvidenceCheck[] = [];

  for (const s of analysis.skills.required) {
    checks.push({
      origin: "skill.required",
      label: s.name,
      quote: s.evidence,
      sourced: sourcedIn(s.evidence),
    });
  }
  for (const s of analysis.skills.niceToHave) {
    checks.push({
      origin: "skill.niceToHave",
      label: s.name,
      quote: s.evidence,
      sourced: sourcedIn(s.evidence),
    });
  }
  for (const f of analysis.realityCheck.redFlags) {
    checks.push({
      origin: "redFlag",
      label: f.translation,
      quote: f.phrase,
      sourced: sourcedIn(f.phrase),
    });
  }
  for (const f of analysis.realityCheck.greenFlags) {
    checks.push({
      origin: "greenFlag",
      label: f.why,
      quote: f.phrase,
      sourced: sourcedIn(f.phrase),
    });
  }
  for (const c of analysis.company?.cultureSignals ?? []) {
    checks.push({
      origin: "cultureSignal",
      label: c.meaning,
      quote: c.phrase,
      sourced: sourcedIn(c.phrase),
    });
  }

  const unsourced = checks.filter((c) => !c.sourced);
  const unsourcedFlagCount = unsourced.filter(
    (c) => c.origin === "redFlag" || c.origin === "greenFlag"
  ).length;

  return {
    checks,
    total: checks.length,
    sourced: checks.length - unsourced.length,
    unsourced,
    unsourcedFlagCount,
  };
}
