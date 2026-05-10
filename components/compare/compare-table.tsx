"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeToHistory,
} from "@/lib/storage/history";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { computeFallbackVerdict } from "@/lib/analysis/verdict";
import { computeFitScore } from "@/lib/analysis/fit-score";
import {
  getProfileSnapshot,
  getProfileServerSnapshot,
  subscribeToProfile,
} from "@/lib/storage/profile";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Row = {
  id: keyof typeof t.compare.rows;
  render: (entry: StoredAnalysis, profile: ReturnType<typeof getProfileSnapshot>) => React.ReactNode;
  /** Comparator returning a hash used to detect that a value differs across entries. */
  hash: (entry: StoredAnalysis) => string;
};

const ROWS: Row[] = [
  {
    id: "title",
    render: (e) => e.analysis.meta.title,
    hash: (e) => e.analysis.meta.title.toLowerCase().trim(),
  },
  {
    id: "company",
    render: (e) => e.analysis.meta.company ?? "—",
    hash: (e) => (e.analysis.meta.company ?? "").toLowerCase().trim(),
  },
  {
    id: "verdict",
    render: (e) => {
      const v = computeFallbackVerdict(e.analysis);
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold tabular-nums">{v.score}/10</span>
          <span className="text-muted-foreground text-xs">{v.sentiment}</span>
        </div>
      );
    },
    hash: (e) => String(computeFallbackVerdict(e.analysis).score),
  },
  {
    id: "fit",
    render: (e, profile) => {
      const fit = computeFitScore(e.analysis, profile);
      if (fit.profileEmpty) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      return <span className="font-bold tabular-nums">{fit.overall}/10</span>;
    },
    // The fit row depends on the live profile (passed at render time),
    // so we compute its hash inline in the row loop below.
    hash: () => "fit",
  },
  {
    id: "salary",
    render: (e) => {
      const r = e.analysis.meta.salaryRange;
      if (!r) return <span className="text-muted-foreground text-xs">Not disclosed</span>;
      const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
      const sym = r.currency === "EUR" ? "€" : r.currency === "USD" ? "$" : "£";
      return `${sym}${fmt.format(r.min)}–${fmt.format(r.max)}`;
    },
    hash: (e) =>
      e.analysis.meta.salaryRange
        ? `${e.analysis.meta.salaryRange.min}-${e.analysis.meta.salaryRange.max}-${e.analysis.meta.salaryRange.currency}`
        : "none",
  },
  {
    id: "remote",
    render: (e) => e.analysis.meta.remote,
    hash: (e) => e.analysis.meta.remote,
  },
  {
    id: "location",
    render: (e) => e.analysis.meta.location ?? "—",
    hash: (e) => (e.analysis.meta.location ?? "").toLowerCase().trim(),
  },
  {
    id: "seniority",
    render: (e) => e.analysis.meta.seniorityAnnounced,
    hash: (e) => e.analysis.meta.seniorityAnnounced,
  },
  {
    id: "stack",
    render: (e) => (
      <ul className="flex flex-wrap gap-1">
        {e.analysis.skills.required.slice(0, 8).map((s) => (
          <li
            key={s.name}
            className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]"
          >
            {s.name}
          </li>
        ))}
        {e.analysis.skills.required.length > 8 && (
          <li className="text-muted-foreground text-[10px]">
            +{e.analysis.skills.required.length - 8}
          </li>
        )}
      </ul>
    ),
    hash: (e) =>
      e.analysis.skills.required
        .map((s) => s.name.toLowerCase())
        .sort()
        .join(","),
  },
  {
    id: "redFlags",
    render: (e) => {
      const reds = e.analysis.realityCheck.redFlags;
      if (reds.length === 0) return <span className="text-muted-foreground text-xs">None</span>;
      return (
        <div>
          <div className="text-foreground text-sm font-medium tabular-nums">
            {reds.length}
          </div>
          <div className="text-muted-foreground text-[10px]">
            {reds.filter((f) => f.severity === "high").length} high ·{" "}
            {reds.filter((f) => f.severity === "medium").length} med ·{" "}
            {reds.filter((f) => f.severity === "low").length} low
          </div>
        </div>
      );
    },
    hash: (e) => String(e.analysis.realityCheck.redFlags.length),
  },
  {
    id: "greenFlags",
    render: (e) => e.analysis.realityCheck.greenFlags.length || "—",
    hash: (e) => String(e.analysis.realityCheck.greenFlags.length),
  },
  {
    id: "status",
    render: (e) => {
      const s = e.application?.status ?? "interested";
      return <span>{t.application.statuses[s]}</span>;
    },
    hash: (e) => e.application?.status ?? "interested",
  },
];

export function CompareTable({ ids }: { ids: string[] }) {
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );
  const profile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const entries = useMemo(
    () =>
      ids
        .map((id) => items.find((e) => e.id === id))
        .filter((e): e is StoredAnalysis => e !== undefined),
    [ids, items]
  );

  if (entries.length < 2) {
    return <Invalid />;
  }

  const colCount = entries.length;

  return (
    <div className="space-y-4">
      <Link
        href="/pipeline"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        {t.compare.backToPipeline}
      </Link>

      <div className="bg-card overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-muted-foreground bg-muted/30 sticky left-0 z-10 w-[140px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"></th>
              {entries.map((e) => (
                <th key={e.id} className="px-4 py-3 text-left">
                  <div className="text-foreground text-sm font-semibold tracking-tight">
                    {e.analysis.meta.title}
                  </div>
                  <Link
                    href={`/?id=${e.id}`}
                    className="text-muted-foreground hover:text-foreground text-xs hover:underline"
                  >
                    {t.pipeline.cardOpen} →
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              // Determine if values differ across columns to highlight.
              const hashes =
                row.id === "fit"
                  ? entries.map((e) =>
                      String(computeFitScore(e.analysis, profile).overall)
                    )
                  : entries.map((e) => row.hash(e));
              const allSame = hashes.every((h) => h === hashes[0]);
              return (
                <tr key={row.id} className="border-t">
                  <th
                    scope="row"
                    className="text-muted-foreground bg-muted/30 sticky left-0 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {t.compare.rows[row.id]}
                  </th>
                  {entries.map((e) => (
                    <td
                      key={e.id}
                      className={cn(
                        "px-4 py-3 align-top",
                        !allSame && "bg-amber-500/[0.05]"
                      )}
                      colSpan={1}
                    >
                      {row.render(e, profile)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs">
        Highlighted cells indicate values that differ across the {colCount}{" "}
        offers.
      </p>
    </div>
  );
}

function Invalid() {
  return (
    <div className="bg-card flex flex-col items-center gap-3 rounded-xl border-2 border-dashed py-12 text-center">
      <AlertCircle className="text-muted-foreground size-6" />
      <p className="text-foreground text-sm font-medium">
        {t.compare.invalid}
      </p>
      <Link href="/pipeline">
        <Button variant="outline" size="sm">
          <ArrowLeft className="size-3.5" />
          {t.compare.backToPipeline}
        </Button>
      </Link>
    </div>
  );
}
