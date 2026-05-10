"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  computeFallbackVerdict,
  sentimentMeta,
} from "@/lib/analysis/verdict";
import {
  analysisToMarkdown,
  downloadMarkdown,
  safeFileSlug,
} from "@/lib/export/markdown";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function VerdictHero({ entry }: { entry: StoredAnalysis }) {
  const verdict = computeFallbackVerdict(entry.analysis);
  const meta = sentimentMeta[verdict.sentiment];
  const sentimentLabel = t.result.sentiment[verdict.sentiment];
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const md = analysisToMarkdown(entry);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      toast.success(t.result.verdict.copyToast);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.result.verdict.copyError);
    }
  };

  const handleDownload = () => {
    const slug = safeFileSlug(entry.analysis.meta.title);
    downloadMarkdown(`${slug}.md`, analysisToMarkdown(entry));
  };

  const ringPct = (verdict.score / 10) * 100;

  return (
    <Card className={cn("overflow-hidden border-2", meta.bg)}>
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-7">
        <ScoreRing score={verdict.score} pct={ringPct} tone={meta.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-[10px] font-semibold uppercase tracking-[0.15em]",
                meta.tone
              )}
            >
              {sentimentLabel}
            </span>
            <span className="text-muted-foreground/70 font-mono text-[10px] uppercase tracking-[0.15em]">
              · {t.result.verdict.eyebrow}
            </span>
          </div>
          <p className="text-foreground mt-2 text-xl font-medium leading-snug tracking-tight">
            {verdict.oneLiner}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label={t.result.verdict.copyAria}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="hidden sm:inline">
              {copied ? t.result.verdict.copied : t.result.verdict.copy}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            aria-label={t.result.verdict.exportAria}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">{t.result.verdict.export}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ScoreRing({
  score,
  pct,
  tone,
}: {
  score: number;
  pct: number;
  tone: string;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          className="stroke-muted-foreground/15"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          className={cn("transition-[stroke-dashoffset] duration-700", tone)}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={cn("text-2xl font-bold tabular-nums", tone)}>
          {score}
        </span>
        <span className="text-muted-foreground text-[10px]">/ 10</span>
      </div>
    </div>
  );
}
