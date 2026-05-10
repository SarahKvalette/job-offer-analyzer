"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, AlertCircle } from "lucide-react";
import type { JobAnalysis } from "@/lib/schemas/analysis";
import { parseSalaryRange, type ParsedSalary } from "@/lib/detectors/salary-parser";
import {
  compareSalary,
  findBenchmark,
  normaliseLevel,
  normaliseLocation,
  type SalaryComparison,
} from "@/lib/detectors/salary-benchmark";
import { inferBenchmarkRole } from "@/lib/detectors/role-inference";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatRange(s: ParsedSalary | null): string | null {
  if (!s) return null;
  const period =
    s.period === "year"
      ? t.result.salary.perPeriod.year
      : s.period === "month"
      ? t.result.salary.perPeriod.month
      : t.result.salary.perPeriod.day;
  const symbol = s.currency === "EUR" ? "€" : s.currency === "USD" ? "$" : "£";
  return `${symbol}${fmt.format(s.min)}–${fmt.format(s.max)} ${period}`;
}

/**
 * Resolve the declared salary range:
 *   1. Trust analysis.meta.salaryRange when present (LLM did the work).
 *   2. Otherwise run the local parser against the original posting.
 */
function resolveDeclared(
  meta: JobAnalysis["meta"],
  jobText: string
): ParsedSalary | null {
  if (meta.salaryRange) {
    return {
      min: meta.salaryRange.min,
      max: meta.salaryRange.max,
      // Schema doesn't validate the currency string against our enum, so we
      // narrow lazily — anything other than EUR / USD / GBP makes the
      // benchmark step bail out cleanly.
      currency: (meta.salaryRange.currency.toUpperCase() as ParsedSalary["currency"]) ?? "EUR",
      period: "year",
      rawMatch: meta.salaryRange.currency,
    };
  }
  return parseSalaryRange(jobText);
}

export function SalaryCard({
  analysis,
  jobText,
}: {
  analysis: JobAnalysis;
  jobText: string;
}) {
  const declared = useMemo(
    () => resolveDeclared(analysis.meta, jobText),
    [analysis.meta, jobText]
  );

  const comparison = useMemo<SalaryComparison | null>(() => {
    if (!declared) return null;
    const role = inferBenchmarkRole(analysis.meta.title);
    const level = normaliseLevel(analysis.meta.seniorityAnnounced);
    const location = normaliseLocation(analysis.meta.location);
    if (!role || !level || !location) return null;
    const bench = findBenchmark(role, level, location);
    if (!bench) return null;
    return compareSalary(declared, bench);
  }, [declared, analysis.meta]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="size-5" />
          {t.result.salary.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!declared ? <NotDisclosedState /> : (
          <DisclosedState declared={declared} comparison={comparison} />
        )}
      </CardContent>
    </Card>
  );
}

function NotDisclosedState() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
      <AlertCircle className="text-amber-500 mt-0.5 size-4 shrink-0" />
      <div>
        <p className="text-foreground/90 text-sm font-medium">
          {t.result.salary.notDisclosed}
        </p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {t.result.salary.notDisclosedHint}
        </p>
      </div>
    </div>
  );
}

function DisclosedState({
  declared,
  comparison,
}: {
  declared: ParsedSalary;
  comparison: SalaryComparison | null;
}) {
  const declaredFormatted = formatRange(declared);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label={t.result.salary.announcedLabel}
          value={declaredFormatted ?? "—"}
        />
        {comparison ? (
          <Stat
            label={t.result.salary.marketLabel}
            value={`€${fmt.format(comparison.benchmark.min)}–${fmt.format(
              comparison.benchmark.max
            )} ${t.result.salary.perPeriod.year}`}
            hint={t.result.salary.benchmarkSourceFR}
          />
        ) : (
          <Stat
            label={t.result.salary.marketLabel}
            value="—"
            hint={t.result.salary.benchmarkUnavailable}
          />
        )}
      </div>

      {comparison && <PositionBar comparison={comparison} />}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-md border px-3 py-2.5">
      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-foreground mt-0.5 text-sm font-medium tabular-nums">
        {value}
      </p>
      {hint && (
        <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p>
      )}
    </div>
  );
}

const POSITION_TONE: Record<
  SalaryComparison["position"],
  { text: string; bar: string }
> = {
  below: { text: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
  parity: {
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  above: {
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
};

function PositionBar({ comparison }: { comparison: SalaryComparison }) {
  const { position, deltaPercent, declaredMedian, benchmark } = comparison;
  const tone = POSITION_TONE[position];

  // The bar maps the spectrum 0.5× → 1.5× of market median.
  // Position 0% on the bar is "−50% from market", 100% is "+50%".
  const ratio = declaredMedian / benchmark.median;
  const pct = Math.max(0, Math.min(100, ((ratio - 0.5) / 1.0) * 100));

  const positionText =
    position === "below"
      ? t.result.salary.position.below(deltaPercent)
      : position === "above"
      ? t.result.salary.position.above(deltaPercent)
      : t.result.salary.position.parity;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className={cn("text-sm font-medium", tone.text)}>
          {positionText}
        </span>
        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {deltaPercent >= 0 ? "+" : ""}
          {deltaPercent}%
        </span>
      </div>
      <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
        {/* Market median tick at 50% */}
        <div
          aria-hidden
          className="bg-foreground/40 absolute top-0 h-full w-px"
          style={{ left: "50%" }}
        />
        <div
          className={cn("h-full transition-all", tone.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
