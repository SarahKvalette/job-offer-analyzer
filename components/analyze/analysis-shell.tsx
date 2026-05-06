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
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  getById,
  newAnalysisId,
  saveAnalysis,
} from "@/lib/storage/history";
import type { JobAnalysis, StoredAnalysis } from "@/lib/schemas/analysis";

type Status = "idle" | "loading" | "success";

type ApiSuccess = { analysis: JobAnalysis };
type ApiError = { error: { code: string; message: string } };

export function AnalysisShell({ initialId }: { initialId: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState<StoredAnalysis | null>(null);

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
        throw new Error(err?.error?.message ?? "Analysis failed.");
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
      const msg = err instanceof Error ? err.message : "Analysis failed.";
      toast.error(msg);
      setStatus("idle");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setCurrent(null);
    window.history.replaceState(null, "", "/");
  }, []);

  if (status === "idle") {
    return (
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Decode any job posting in 10 seconds.
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Paste a tech job offer. Get the real seniority, hidden red flags, the
            skills they forgot to list, and 3-5 questions to ask the recruiter.
          </p>
        </header>
        <JobInputForm pending={false} onSubmit={handleSubmit} />
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="-ml-2"
            >
              <ArrowLeft className="size-4" />
              New analysis
            </Button>
            <span className="text-muted-foreground text-xs">
              {new Date(current.createdAt).toLocaleString()}
            </span>
          </div>
          <MetaCard meta={current.analysis.meta} />
          <SkillsSection skills={current.analysis.skills} />
          <RealityCheck realityCheck={current.analysis.realityCheck} />
          <QuestionsList questions={current.analysis.questionsToAsk} />
        </div>
        <aside className="bg-card lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] rounded-lg border">
          <SourceHighlighter source={current.jobText} />
        </aside>
      </div>
    </HighlightProvider>
  );
}
