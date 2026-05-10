"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@base-ui/react/tabs";
import {
  MessageCircleQuestion,
  Copy,
  Check,
  Loader2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { questionsToText } from "@/lib/export/markdown";
import { saveAnalysis } from "@/lib/storage/history";
import type {
  CategorizedQuestions,
  QuestionStage,
  StoredAnalysis,
} from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ApiSuccess = { categorized: CategorizedQuestions };
type ApiError = { error: { code: string; message: string } };

type Tab = "all" | QuestionStage;

const STAGE_ORDER: QuestionStage[] = ["rh", "technique", "manager", "final"];

export function QuestionsList({ entry }: { entry: StoredAnalysis }) {
  const questions = entry.analysis.questionsToAsk;
  const [tab, setTab] = useState<Tab>("all");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const categorized = entry.categorizedQuestions ?? null;

  const handleCategorize = async () => {
    if (questions.length === 0) return;
    setPending(true);
    try {
      const res = await fetch("/api/categorize-questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? t.result.questions.categorize.failed);
      }
      const data = (await res.json()) as ApiSuccess;
      saveAnalysis({ ...entry, categorizedQuestions: data.categorized });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t.result.questions.categorize.failed;
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  const visibleQuestions = pickQuestions(tab, questions, categorized);

  const handleCopy = async () => {
    if (!visibleQuestions.length) return;
    try {
      await navigator.clipboard.writeText(questionsToText(visibleQuestions));
      setCopied(true);
      toast.success(t.result.questions.copyToast);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.result.questions.copyError);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="size-5" />
          {t.result.questions.title}
        </CardTitle>
        {questions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {!categorized && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCategorize}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {t.result.questions.categorize.loading}
                  </>
                ) : (
                  <>
                    <Layers className="size-3.5" />
                    {t.result.questions.categorize.cta}
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label={t.result.questions.copyAria}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t.result.questions.copied : t.result.questions.copy}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t.result.questions.empty}
          </p>
        ) : categorized ? (
          <CategorizedView
            tab={tab}
            onTabChange={setTab}
            questions={questions}
            categorized={categorized}
          />
        ) : (
          <FlatList items={questions} />
        )}
      </CardContent>
    </Card>
  );
}

function pickQuestions(
  tab: Tab,
  all: string[],
  categorized: CategorizedQuestions | null
): string[] {
  if (tab === "all" || !categorized) return all;
  return categorized[tab];
}

function FlatList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((q, i) => (
        <li key={i} className="flex gap-3">
          <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {i + 1}
          </span>
          <p className="text-sm leading-relaxed">{q}</p>
        </li>
      ))}
    </ol>
  );
}

function CategorizedView({
  tab,
  onTabChange,
  questions,
  categorized,
}: {
  tab: Tab;
  onTabChange: (next: Tab) => void;
  questions: string[];
  categorized: CategorizedQuestions;
}) {
  const counts: Record<Tab, number> = {
    all: questions.length,
    rh: categorized.rh.length,
    technique: categorized.technique.length,
    manager: categorized.manager.length,
    final: categorized.final.length,
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "all", label: t.result.questions.tabs.all },
    { id: "rh", label: t.result.questions.tabs.rh },
    { id: "technique", label: t.result.questions.tabs.technique },
    { id: "manager", label: t.result.questions.tabs.manager },
    { id: "final", label: t.result.questions.tabs.final },
  ];

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(v) => onTabChange(v as Tab)}
      className="w-full"
    >
      <Tabs.List className="bg-muted/40 mb-4 flex flex-wrap gap-1 overflow-x-auto rounded-md p-1">
        {tabs.map((tt) => (
          <Tabs.Tab
            key={tt.id}
            value={tt.id}
            className={cn(
              "data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
              "text-muted-foreground inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              "hover:text-foreground"
            )}
          >
            {tt.label}
            <span
              className={cn(
                "rounded font-mono text-[10px] tabular-nums",
                counts[tt.id] === 0
                  ? "text-muted-foreground/50"
                  : "text-muted-foreground"
              )}
            >
              {counts[tt.id]}
            </span>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {/* Panels */}
      <Tabs.Panel value="all">
        <FlatList items={questions} />
      </Tabs.Panel>
      {STAGE_ORDER.map((stage) => (
        <Tabs.Panel key={stage} value={stage}>
          {categorized[stage].length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No questions in this stage.
            </p>
          ) : (
            <FlatList items={categorized[stage]} />
          )}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
