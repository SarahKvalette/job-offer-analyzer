"use client";

import { useMemo } from "react";
import { Popover } from "@base-ui/react/popover";
import { AlertTriangle, Info } from "lucide-react";
import type { JobAnalysis } from "@/lib/schemas/analysis";
import {
  assessGhostJob,
  type GhostJobAssessment,
} from "@/lib/detectors/ghost-job";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const THRESHOLD = 50;

export function GhostJobBadge({
  analysis,
  jobText,
}: {
  analysis: JobAnalysis;
  jobText: string;
}) {
  const assessment = useMemo<GhostJobAssessment>(
    () => assessGhostJob(analysis, jobText),
    [analysis, jobText]
  );

  if (assessment.score < THRESHOLD) return null;

  const tone = toneFor(assessment.score);

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          tone.button
        )}
      >
        <AlertTriangle className="size-3.5" />
        <span>{t.result.ghost.badgeLabel}</span>
        <span
          className={cn(
            "border-foreground/15 ml-0.5 rounded border px-1 font-mono text-[10px] tabular-nums",
            tone.scoreChip
          )}
        >
          {assessment.score}%
        </span>
        <Info className="text-muted-foreground/70 ml-0.5 size-3" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start">
          <Popover.Popup
            className={cn(
              "bg-popover ring-border/60 z-50 max-w-sm rounded-lg p-4 shadow-xl ring-1",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out data-[state=open]:fade-in",
              "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
              "duration-150"
            )}
          >
            <Popover.Title className="text-foreground text-sm font-semibold">
              {t.result.ghost.breakdownTitle}
            </Popover.Title>

            <ul className="mt-3 space-y-2.5">
              <CriterionRow
                label={t.result.ghost.criteria.vagueDescription}
                score={assessment.breakdown.vagueDescription.score}
                reason={assessment.breakdown.vagueDescription.reason}
              />
              <CriterionRow
                label={t.result.ghost.criteria.noSalary}
                score={assessment.breakdown.noSalary.score}
                reason={assessment.breakdown.noSalary.reason}
              />
              <CriterionRow
                label={t.result.ghost.criteria.externalRecruiter}
                score={assessment.breakdown.externalRecruiter.score}
                reason={assessment.breakdown.externalRecruiter.reason}
              />
              <CriterionRow
                label={t.result.ghost.criteria.genericCompany}
                score={assessment.breakdown.genericCompany.score}
                reason={assessment.breakdown.genericCompany.reason}
              />
            </ul>

            <p className="text-muted-foreground border-border/60 mt-4 border-t pt-3 text-[11px] leading-relaxed">
              {t.result.ghost.whatItMeans}
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CriterionRow({
  label,
  score,
  reason,
}: {
  label: string;
  score: number;
  reason: string;
}) {
  const pct = Math.round(score * 100);
  const intensity =
    score >= 0.7
      ? "bg-red-500"
      : score >= 0.4
      ? "bg-amber-500"
      : score > 0
      ? "bg-amber-500/40"
      : "bg-emerald-500";
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-foreground text-xs font-medium">{label}</span>
        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="bg-muted h-1 overflow-hidden rounded-full">
        <div className={cn("h-full", intensity)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
        {reason}
      </p>
    </li>
  );
}

function toneFor(score: number) {
  if (score >= 75) {
    return {
      button:
        "border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:text-red-300",
      scoreChip: "bg-red-500/20 text-red-700 dark:text-red-300",
    };
  }
  return {
    button:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300",
    scoreChip: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  };
}
