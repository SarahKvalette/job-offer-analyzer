"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeToHistory,
} from "@/lib/storage/history";
import { computeFallbackVerdict } from "@/lib/analysis/verdict";
import type { ApplicationStatus, StoredAnalysis } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_ORDER: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ignored",
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  interested: "bg-slate-500",
  applied: "bg-blue-500",
  interview: "bg-violet-500",
  offer: "bg-emerald-500",
  rejected: "bg-red-500",
  ignored: "bg-zinc-400",
};

interface Stats {
  totalAnalyses: number;
  averageScore: number;
  withVerdict: number;
  byStatus: Record<ApplicationStatus, number>;
  topRedFlags: Array<{ phrase: string; count: number }>;
  conversionApplyToInterview: number; // percent
  conversionInterviewToOffer: number; // percent
  recentTimeline: Array<{ date: string; count: number; avgScore: number }>;
}

function buildStats(items: readonly StoredAnalysis[]): Stats {
  const byStatus: Record<ApplicationStatus, number> = {
    interested: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ignored: 0,
  };
  const redFlagCounter = new Map<string, number>();
  let scoreSum = 0;

  for (const entry of items) {
    const status = entry.application?.status ?? "interested";
    byStatus[status] += 1;
    const verdict = computeFallbackVerdict(entry.analysis);
    scoreSum += verdict.score;
    for (const flag of entry.analysis.realityCheck.redFlags) {
      const key = flag.phrase.toLowerCase().trim();
      redFlagCounter.set(key, (redFlagCounter.get(key) ?? 0) + 1);
    }
  }

  const topRedFlags = Array.from(redFlagCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase, count]) => ({ phrase, count }));

  // Conversions (applied→interview→offer use the cumulative funnel — every
  // entry that's currently "interview" or "offer" once was at least
  // "applied" by definition of the linear pipeline).
  const appliedOrBeyond =
    byStatus.applied + byStatus.interview + byStatus.offer + byStatus.rejected;
  const interviewedOrBeyond =
    byStatus.interview + byStatus.offer + byStatus.rejected;
  const offered = byStatus.offer;

  const conversionApplyToInterview =
    appliedOrBeyond > 0
      ? Math.round((interviewedOrBeyond / appliedOrBeyond) * 100)
      : 0;
  const conversionInterviewToOffer =
    interviewedOrBeyond > 0
      ? Math.round((offered / interviewedOrBeyond) * 100)
      : 0;

  // Timeline: group by week of createdAt, last 8 weeks.
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const buckets = new Map<number, { count: number; scoreSum: number }>();
  for (const entry of items) {
    const weekOffset = Math.floor((now - entry.createdAt) / WEEK_MS);
    if (weekOffset > 7) continue;
    const bucket = buckets.get(weekOffset) ?? { count: 0, scoreSum: 0 };
    bucket.count += 1;
    bucket.scoreSum += computeFallbackVerdict(entry.analysis).score;
    buckets.set(weekOffset, bucket);
  }
  const recentTimeline = Array.from({ length: 8 }, (_, i) => {
    const offset = 7 - i;
    const data = buckets.get(offset) ?? { count: 0, scoreSum: 0 };
    const weekStart = new Date(now - offset * WEEK_MS);
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    return {
      date: label,
      count: data.count,
      avgScore: data.count > 0 ? data.scoreSum / data.count : 0,
    };
  });

  return {
    totalAnalyses: items.length,
    averageScore: items.length > 0 ? scoreSum / items.length : 0,
    withVerdict: items.length,
    byStatus,
    topRedFlags,
    conversionApplyToInterview,
    conversionInterviewToOffer,
    recentTimeline,
  };
}

export function StatsDashboard() {
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );
  const stats = useMemo(() => buildStats(items), [items]);

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-xl border-2 border-dashed py-12 text-center">
        <p className="text-foreground text-sm font-medium">
          {t.stats.empty.title}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {t.stats.empty.body}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Briefcase className="size-4" />}
          label={t.stats.totalAnalyses}
          value={String(stats.totalAnalyses)}
        />
        <KpiCard
          icon={<Sparkles className="size-4" />}
          label={t.stats.averageScore}
          value={stats.averageScore.toFixed(1)}
          hint="/10"
        />
        <KpiCard
          icon={<ClipboardCheck className="size-4" />}
          label={t.stats.applyToInterview}
          value={`${stats.conversionApplyToInterview}%`}
        />
        <KpiCard
          icon={<CheckCircle2 className="size-4" />}
          label={t.stats.interviewToOffer}
          value={`${stats.conversionInterviewToOffer}%`}
        />
      </div>

      {/* Pipeline distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            {t.stats.pipelineDistribution}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineBar stats={stats} />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.stats.timeline}</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline stats={stats} />
        </CardContent>
      </Card>

      {/* Top red flags */}
      {stats.topRedFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              {t.stats.topRedFlags}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.topRedFlags.map((flag) => (
                <li
                  key={flag.phrase}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-foreground/90 truncate italic">
                    “{flag.phrase}”
                  </span>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    ×{flag.count}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="bg-muted/50 ring-border flex size-9 items-center justify-center rounded-lg ring-1">
          {icon}
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-foreground text-2xl font-bold tabular-nums">
            {value}
            {hint && (
              <span className="text-muted-foreground text-sm font-normal">
                {" "}
                {hint}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineBar({ stats }: { stats: Stats }) {
  const total = STATUS_ORDER.reduce((acc, s) => acc + stats.byStatus[s], 0);
  if (total === 0) return null;
  return (
    <div className="space-y-3">
      <div className="bg-muted flex h-3 overflow-hidden rounded-full">
        {STATUS_ORDER.map((s) => {
          const pct = (stats.byStatus[s] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s}
              className={cn("h-full", STATUS_TONE[s])}
              style={{ width: `${pct}%` }}
              title={`${t.application.statuses[s]}: ${stats.byStatus[s]}`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {STATUS_ORDER.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-xs">
            <span aria-hidden className={cn("size-2 rounded", STATUS_TONE[s])} />
            <span className="text-muted-foreground flex-1 truncate">
              {t.application.statuses[s]}
            </span>
            <span className="text-foreground font-mono tabular-nums">
              {stats.byStatus[s]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Timeline({ stats }: { stats: Stats }) {
  const maxCount = Math.max(...stats.recentTimeline.map((t) => t.count), 1);
  return (
    <div>
      <div className="flex h-32 items-end gap-1.5">
        {stats.recentTimeline.map((point) => {
          const heightPct = (point.count / maxCount) * 100;
          return (
            <div
              key={point.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                className={cn(
                  "bg-foreground/70 hover:bg-foreground w-full rounded-t transition-colors",
                  point.count === 0 && "bg-muted hover:bg-muted"
                )}
                style={{ height: `${heightPct}%`, minHeight: 2 }}
                title={`${point.count} analyses · avg ${point.avgScore.toFixed(1)}/10`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 text-[10px]">
        {stats.recentTimeline.map((point) => (
          <div
            key={point.date}
            className="text-muted-foreground flex-1 text-center font-mono"
          >
            {point.date}
          </div>
        ))}
      </div>
    </div>
  );
}
