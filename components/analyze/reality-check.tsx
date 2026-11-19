"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, Gauge, ChevronDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useEvidenceHandlers,
  useHighlight,
} from "@/components/analyze/highlight-context";
import { isLocatable } from "@/lib/analysis/verify-evidence";
import type { ContestedSignal, StoredAnalysis } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { mergeRedFlags, type MergedRedFlag } from "@/lib/detectors/merge-flags";

type Severity = "low" | "medium" | "high";
type ContestHandler = (phrase: string, next: ContestedSignal | null) => void;

const severityStyles: Record<Severity, string> = {
  low: "border-amber-500/40 bg-amber-500/5",
  medium: "border-orange-500/50 bg-orange-500/10",
  high: "border-red-500/60 bg-red-500/10",
};

const severityLabel = t.result.realityCheck.severity;
const seniorityLabel = {
  junior: t.result.meta.seniorityLabels.junior,
  mid: t.result.meta.seniorityLabels.mid,
  senior: t.result.meta.seniorityLabels.senior,
  staff: t.result.meta.seniorityLabels.staff,
} as const;

/**
 * Reality-check card. When `onContest` is provided (a saved analysis), each
 * signal is expandable: it highlights its citation in the posting, flags
 * unsourced quotes, and lets the user contest the signal with an optional
 * note (stored locally). Read-only otherwise (examples / unsaved previews).
 */
export function RealityCheck({
  entry,
  onContest,
}: {
  entry: StoredAnalysis;
  onContest?: ContestHandler;
}) {
  const { redFlags, greenFlags, seniorityRealVsAnnounced } =
    entry.analysis.realityCheck;
  const jobText = entry.jobText;
  const contested = entry.contestedSignals ?? {};

  const mergedRedFlags = useMemo<MergedRedFlag[]>(() => {
    if (jobText && jobText.length > 0) return mergeRedFlags(redFlags, jobText);
    return redFlags.map((f) => ({
      phrase: f.phrase,
      translation: f.translation,
      severity: f.severity,
      source: "llm",
    }));
  }, [redFlags, jobText]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.result.realityCheck.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {t.result.contest.honesty}
        </p>

        <section>
          <header className="mb-3 flex items-center gap-2">
            <Gauge className="size-4" />
            <h3 className="text-sm font-medium">
              {t.result.realityCheck.realSeniorityLabel}
            </h3>
            <Badge variant="secondary">
              {seniorityLabel[seniorityRealVsAnnounced.real]}
            </Badge>
          </header>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {seniorityRealVsAnnounced.reasoning}
          </p>
        </section>

        <section>
          <header className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h3 className="text-sm font-medium">
              {t.result.realityCheck.redFlagsLabel}
            </h3>
            <span className="text-muted-foreground text-xs">
              {mergedRedFlags.length}
            </span>
          </header>
          {mergedRedFlags.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t.result.realityCheck.noneSpotted}
            </p>
          ) : (
            <ul className="space-y-2">
              {mergedRedFlags.map((flag) => (
                <SignalItem
                  key={flag.phrase + flag.translation + flag.source}
                  phrase={flag.phrase}
                  caption={flag.translation}
                  advice={flag.advice}
                  isFR={flag.source === "fr-dictionary"}
                  severity={flag.severity}
                  tone="red"
                  jobText={jobText}
                  contested={contested[flag.phrase]}
                  onContest={onContest}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <header className="mb-3 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-500" />
            <h3 className="text-sm font-medium">
              {t.result.realityCheck.greenFlagsLabel}
            </h3>
            <span className="text-muted-foreground text-xs">
              {greenFlags.length}
            </span>
          </header>
          {greenFlags.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t.result.realityCheck.noneSpotted}
            </p>
          ) : (
            <ul className="space-y-2">
              {greenFlags.map((flag) => (
                <SignalItem
                  key={flag.phrase + flag.why}
                  phrase={flag.phrase}
                  caption={flag.why}
                  tone="green"
                  jobText={jobText}
                  contested={contested[flag.phrase]}
                  onContest={onContest}
                />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function SignalItem({
  phrase,
  caption,
  advice,
  isFR,
  severity,
  tone,
  jobText,
  contested,
  onContest,
}: {
  phrase: string;
  caption: string;
  advice?: string;
  isFR?: boolean;
  severity?: Severity;
  tone: "red" | "green";
  jobText: string;
  contested?: ContestedSignal;
  onContest?: ContestHandler;
}) {
  const hover = useEvidenceHandlers(phrase);
  const { setActive } = useHighlight();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(contested?.note ?? "");

  const locatable = jobText.length === 0 || isLocatable(phrase, jobText);
  const isContested = contested?.contested === true;
  const canContest = typeof onContest === "function";

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    setActive(next ? phrase : null);
  };

  const borderTone =
    tone === "green"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : severityStyles[severity ?? "medium"];

  return (
    <li
      className={cn(
        "rounded-md border transition-colors",
        borderTone,
        isContested && "opacity-60"
      )}
      {...hover}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={t.result.contest.expandAria}
        className="flex min-h-[44px] w-full items-start gap-2 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-foreground/90 text-sm italic",
              isContested && "line-through"
            )}
          >
            “{phrase}”
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{caption}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {!locatable && (
            <span
              title={t.result.contest.notSourcedTooltip}
              className="rounded border border-amber-500/40 px-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400"
            >
              {t.result.contest.notSourced}
            </span>
          )}
          {isContested && (
            <Badge variant="outline">{t.result.contest.contested}</Badge>
          )}
          {isFR && (
            <span
              className="border-foreground/20 text-muted-foreground rounded border px-1 font-mono text-[9px] font-semibold uppercase tracking-wider"
              title={t.result.realityCheck.sourceFRTooltip}
            >
              {t.result.realityCheck.sourceFR}
            </span>
          )}
          {severity && <Badge variant="outline">{severityLabel[severity]}</Badge>}
          <ChevronDown
            className={cn(
              "size-4 opacity-60 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 border-t px-3 pb-3 pt-2">
          {advice && (
            <p className="text-foreground/70 text-[11px] leading-relaxed">
              <span className="font-medium">
                {t.result.realityCheck.adviceLabel}
              </span>{" "}
              {advice}
            </p>
          )}
          <p className="text-muted-foreground text-[11px]">
            {locatable
              ? t.result.contest.sourceHint
              : t.result.contest.notSourcedTooltip}
          </p>
          {canContest && (
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                variant={isContested ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isContested) {
                    onContest?.(phrase, null);
                    setNote("");
                  } else {
                    onContest?.(phrase, {
                      contested: true,
                      note: note.trim() || undefined,
                    });
                  }
                }}
              >
                {isContested
                  ? t.result.contest.restore
                  : t.result.contest.disagree}
              </Button>
              {isContested && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() =>
                    onContest?.(phrase, {
                      contested: true,
                      note: note.trim() || undefined,
                    })
                  }
                  placeholder={t.result.contest.notePlaceholder}
                  rows={2}
                  className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full resize-y rounded-md border px-3 py-2 text-xs outline-none focus-visible:ring-2"
                />
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
