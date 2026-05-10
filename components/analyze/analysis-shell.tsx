"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { JobInputForm } from "./job-input-form";
import { ResultSkeleton } from "./result-skeleton";
import { MetaCard } from "./meta-card";
import { SkillsSection } from "./skills-section";
import { RealityCheck } from "./reality-check";
import { QuestionsList } from "./questions-list";
import { SourceHighlighter } from "./source-highlighter";
import { HighlightProvider } from "./highlight-context";
import { VerdictHero } from "./verdict-hero";
import { CompanyCard } from "./company-card";
import { LandingHero } from "./landing-hero";
import { FeatureRail } from "./feature-rail";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, LayoutPanelLeft } from "lucide-react";
import {
  getById,
  newAnalysisId,
  saveAnalysis,
} from "@/lib/storage/history";
import type { JobAnalysis, StoredAnalysis } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type Status = "idle" | "loading" | "success";

type ApiSuccess = { analysis: JobAnalysis };
type ApiError = { error: { code: string; message: string } };

type MobileTab = "analysis" | "source";

export function AnalysisShell({ initialId }: { initialId: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState<StoredAnalysis | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("analysis");

  useEffect(() => {
    if (!initialId) {
      setStatus("idle");
      setCurrent(null);
      return;
    }
    const stored = getById(initialId);
    if (stored) {
      setCurrent(stored);
      setStatus("success");
    } else {
      setStatus("idle");
      setCurrent(null);
    }
  }, [initialId]);

  const handleSubmit = useCallback(async (jobText: string) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobText }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? t.errors.analysisFailed);
      }
      const data = (await res.json()) as ApiSuccess;
      const entry: StoredAnalysis = {
        id: newAnalysisId(),
        createdAt: Date.now(),
        jobText,
        analysis: data.analysis,
      };
      saveAnalysis(entry);
      setCurrent(entry);
      setStatus("success");
      window.history.replaceState(null, "", `/?id=${entry.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.errors.analysisFailed;
      toast.error(msg);
      setStatus("idle");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setCurrent(null);
    setMobileTab("analysis");
    window.history.replaceState(null, "", "/");
  }, []);

  if (status === "idle") {
    return (
      <div className="relative">
        <div
          aria-hidden
          className="hero-bg pointer-events-none absolute inset-x-0 top-[-120px] -z-10 h-[640px]"
        />
        <div className="mx-auto max-w-3xl pt-2 sm:pt-6">
          <LandingHero />
          <div className="relative">
            {/* Subtle violet glow under the form — magnetic feel */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 -bottom-4 -z-10 h-12 rounded-full bg-[color:var(--accent-violet)]/30 blur-3xl dark:bg-[color:var(--accent-violet)]/40"
            />
            <JobInputForm pending={false} onSubmit={handleSubmit} />
          </div>
          <p className="mono-hint mt-6 flex items-center gap-2">
            <span className="bg-emerald-500 size-1.5 rounded-full" />
            {t.landing.privacyHint}
          </p>
          <FeatureRail />
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ResultSkeleton />
      </div>
    );
  }

  if (!current) return null;

  return (
    <HighlightProvider>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* LEFT — analysis */}
        <div
          className={cn(
            "flex flex-col gap-4",
            mobileTab === "source" && "hidden lg:flex"
          )}
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="-ml-2"
            >
              <ArrowLeft className="size-4" />
              {t.form.newAnalysis}
            </Button>
            <span className="text-muted-foreground text-xs">
              {new Date(current.createdAt).toLocaleString()}
            </span>
          </div>

          <MobileTabs tab={mobileTab} onChange={setMobileTab} />

          <VerdictHero entry={current} />
          <RealityCheck realityCheck={current.analysis.realityCheck} />
          {current.analysis.company && (
            <CompanyCard company={current.analysis.company} />
          )}
          <SkillsSection skills={current.analysis.skills} />
          <MetaCard meta={current.analysis.meta} />
          <QuestionsList questions={current.analysis.questionsToAsk} />
        </div>

        {/* RIGHT — source */}
        <aside
          className={cn(
            "bg-card rounded-lg border lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]",
            mobileTab === "analysis" && "hidden lg:block"
          )}
        >
          <div className="lg:hidden">
            <MobileTabs tab={mobileTab} onChange={setMobileTab} />
          </div>
          <SourceHighlighter source={current.jobText} />
        </aside>
      </div>
    </HighlightProvider>
  );
}

function MobileTabs({
  tab,
  onChange,
}: {
  tab: MobileTab;
  onChange: (t: MobileTab) => void;
}) {
  return (
    <div
      role="tablist"
      className="bg-muted/60 grid grid-cols-2 gap-1 rounded-md p-1 lg:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "analysis"}
        onClick={() => onChange("analysis")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
          tab === "analysis"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground"
        )}
      >
        <LayoutPanelLeft className="size-3.5" />
        {t.result.mobileTabs.analysis}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "source"}
        onClick={() => onChange("source")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
          tab === "source"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground"
        )}
      >
        <FileText className="size-3.5" />
        {t.result.mobileTabs.source}
      </button>
    </div>
  );
}
