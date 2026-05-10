import type { JobAnalysis } from "@/lib/schemas/analysis";

type Verdict = NonNullable<JobAnalysis["verdict"]>;

const SEVERITY_WEIGHT = { low: 0.5, medium: 1.2, high: 2.2 } as const;

export function computeFallbackVerdict(analysis: JobAnalysis): Verdict {
  if (analysis.verdict) return analysis.verdict;

  const redWeight = analysis.realityCheck.redFlags.reduce(
    (sum, f) => sum + SEVERITY_WEIGHT[f.severity],
    0
  );
  const greenCount = analysis.realityCheck.greenFlags.length;

  let score = 7 - redWeight + Math.min(greenCount, 4) * 0.5;
  score = Math.max(0, Math.min(10, Math.round(score)));

  const sentiment: Verdict["sentiment"] =
    score >= 7 ? "apply" : score >= 4 ? "caution" : "avoid";

  const oneLiner =
    sentiment === "apply"
      ? "Solid posting overall — proceed and ask the right questions."
      : sentiment === "caution"
      ? "Mixed signals — dig deeper before committing."
      : "Multiple red flags — apply only if you have no better option.";

  return { score, sentiment, oneLiner };
}

export const sentimentMeta: Record<
  Verdict["sentiment"],
  { label: string; tone: string; ring: string; bg: string }
> = {
  apply: {
    label: "Apply",
    tone: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  caution: {
    label: "Caution",
    tone: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  avoid: {
    label: "Avoid",
    tone: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/30",
    bg: "bg-red-500/10 border-red-500/30",
  },
};
