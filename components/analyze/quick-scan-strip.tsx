"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Banknote,
  Ghost,
  Sparkles,
  Target,
} from "lucide-react";
import { assessGhostJob } from "@/lib/detectors/ghost-job";
import { parseSalaryRange } from "@/lib/detectors/salary-parser";
import { computeFitScore, fitLabel } from "@/lib/analysis/fit-score";
import {
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeToProfile,
} from "@/lib/storage/profile";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils";

/**
 * Five-second summary band that sits right under the verdict hero.
 *
 * Lets the user grok everything at a glance before deciding whether to dig
 * into individual cards. Each chip is read-only and links nowhere — the
 * detail card below is the source of truth.
 */
export function QuickScanStrip({ entry }: { entry: StoredAnalysis }) {
  const profile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const ghost = useMemo(
    () => assessGhostJob(entry.analysis, entry.jobText),
    [entry.analysis, entry.jobText]
  );

  const salary = useMemo(() => {
    const declared = entry.analysis.meta.salaryRange;
    if (declared) {
      return {
        min: declared.min,
        max: declared.max,
        currency: declared.currency,
        period: "year" as const,
      };
    }
    const parsed = parseSalaryRange(entry.jobText);
    return parsed
      ? {
          min: parsed.min,
          max: parsed.max,
          currency: parsed.currency,
          period: parsed.period,
        }
      : null;
  }, [entry.analysis.meta.salaryRange, entry.jobText]);

  const fit = useMemo(
    () => computeFitScore(entry.analysis, profile),
    [entry.analysis, profile]
  );

  const redFlagCount = entry.analysis.realityCheck.redFlags.length;
  const fitTone = fit.profileEmpty ? "muted" : fitLabel(fit.overall);

  const salaryDisplay = salary
    ? `${Math.round(salary.min / 1000)}–${Math.round(salary.max / 1000)}k`
    : "Not disclosed";
  const salarySub = salary
    ? salary.period === "year"
      ? salary.currency
      : `${salary.currency} · ${salary.period}`
    : "—";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Chip
        icon={<Target className="size-3.5" />}
        label="Fit"
        value={fit.profileEmpty ? "—" : `${fit.overall}/10`}
        sub={fit.profileEmpty ? "Set up profile" : `${fitTone}`}
        tone={
          fit.profileEmpty
            ? "muted"
            : fitTone === "strong"
              ? "good"
              : fitTone === "ok"
                ? "warn"
                : "bad"
        }
      />
      <Chip
        icon={<Banknote className="size-3.5" />}
        label="Salary"
        value={salaryDisplay}
        sub={salarySub}
        tone={salary ? "good" : "muted"}
      />
      <Chip
        icon={<Ghost className="size-3.5" />}
        label="Ghost risk"
        value={`${ghost.score}/100`}
        sub={ghost.score >= 50 ? "Likely padding" : "Looks real"}
        tone={ghost.score >= 70 ? "bad" : ghost.score >= 50 ? "warn" : "good"}
      />
      <Chip
        icon={
          redFlagCount > 0 ? (
            <AlertTriangle className="size-3.5" />
          ) : (
            <Sparkles className="size-3.5" />
          )
        }
        label="Red flags"
        value={String(redFlagCount)}
        sub={
          redFlagCount === 0
            ? "Clean copy"
            : redFlagCount === 1
              ? "1 caught"
              : `${redFlagCount} caught`
        }
        tone={redFlagCount === 0 ? "good" : redFlagCount > 3 ? "bad" : "warn"}
      />
    </div>
  );
}

type Tone = "good" | "warn" | "bad" | "muted";

const TONE_STYLES: Record<Tone, { wrap: string; icon: string; sub: string }> = {
  good: {
    wrap: "border-emerald-500/30 bg-emerald-500/[0.04]",
    icon: "text-emerald-600 dark:text-emerald-400",
    sub: "text-emerald-700/80 dark:text-emerald-300/80",
  },
  warn: {
    wrap: "border-amber-500/30 bg-amber-500/[0.04]",
    icon: "text-amber-600 dark:text-amber-400",
    sub: "text-amber-700/80 dark:text-amber-300/80",
  },
  bad: {
    wrap: "border-red-500/30 bg-red-500/[0.04]",
    icon: "text-red-600 dark:text-red-400",
    sub: "text-red-700/80 dark:text-red-300/80",
  },
  muted: {
    wrap: "border-border bg-card",
    icon: "text-muted-foreground",
    sub: "text-muted-foreground",
  },
};

function Chip({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-3 py-2.5",
        styles.wrap
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={styles.icon}>{icon}</span>
        <span className="text-muted-foreground font-mono text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-foreground text-base font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        <span className={cn("truncate text-[11px]", styles.sub)}>{sub}</span>
      </div>
    </div>
  );
}
