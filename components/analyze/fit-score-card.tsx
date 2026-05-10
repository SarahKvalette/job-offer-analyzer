"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, Check, User } from "lucide-react";
import {
  computeFitScore,
  fitLabel,
  type FitScore,
} from "@/lib/analysis/fit-score";
import {
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeToProfile,
} from "@/lib/storage/profile";
import type { JobAnalysis } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FitRadar } from "./fit-radar";

const TONE: Record<
  ReturnType<typeof fitLabel>,
  { ring: string; text: string; bg: string }
> = {
  strong: {
    ring: "ring-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/5",
  },
  ok: {
    ring: "ring-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/5",
  },
  weak: {
    ring: "ring-red-500/30",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/5",
  },
};

export function FitScoreCard({ analysis }: { analysis: JobAnalysis }) {
  const profile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const fit = useMemo(
    () => computeFitScore(analysis, profile),
    [analysis, profile]
  );

  if (fit.profileEmpty) return <EmptyState />;

  const label = fitLabel(fit.overall);
  const tone = TONE[label];

  return (
    <Card className={cn("border ring-1", tone.ring, tone.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {t.result.fit.title}
            </CardTitle>
            <p className="text-muted-foreground mt-0.5 font-mono text-[10px] uppercase tracking-wider">
              {t.result.fit.eyebrow}
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold tabular-nums", tone.text)}>
              {fit.overall}
              <span className="text-muted-foreground/70 text-sm font-normal">
                /10
              </span>
            </div>
            <div className={cn("text-xs font-medium", tone.text)}>
              {t.result.fit.labels[label]}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="mx-auto size-[220px]">
            <FitRadar breakdown={fit.breakdown} />
          </div>
          <Notes fit={fit} label={label} />
        </div>
      </CardContent>
    </Card>
  );
}

function Notes({ fit, label }: { fit: FitScore; label: "strong" | "ok" | "weak" }) {
  const heading = t.result.fit.tonalLabels[label];
  const empty = fit.strengths.length === 0 && fit.frictions.length === 0;

  return (
    <div className="space-y-3">
      <p className="text-foreground text-sm font-medium">{heading}</p>
      {empty ? (
        <p className="text-muted-foreground text-sm">
          {t.result.fit.noNotes}
        </p>
      ) : (
        <div className="space-y-3">
          {fit.strengths.length > 0 && (
            <NoteList
              icon={<Check className="size-3.5 text-emerald-500" />}
              label={t.result.fit.sections.strengths}
              items={fit.strengths}
            />
          )}
          {fit.frictions.length > 0 && (
            <NoteList
              icon={<AlertTriangle className="size-3.5 text-amber-500" />}
              label={t.result.fit.sections.frictions}
              items={fit.frictions}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NoteList({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
        {icon}
        {label}
      </h4>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="text-foreground/85 text-sm leading-snug"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-start gap-4 py-5">
        <div className="bg-muted/50 ring-border flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
          <User className="text-muted-foreground size-4" />
        </div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">
            {t.result.fit.empty.title}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t.result.fit.empty.body}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              // Find the profile drawer trigger in the header and click it.
              const trigger = document.querySelector<HTMLElement>(
                'button[aria-label="Open your profile"]'
              );
              trigger?.click();
            }}
          >
            <User className="size-3.5" />
            {t.result.fit.empty.cta}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
