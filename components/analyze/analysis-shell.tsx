"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
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
import { SalaryCard } from "./salary-card";
import { FitScoreCard } from "./fit-score-card";
import { GhostJobBadge } from "./ghost-job-badge";
import { LandingHero } from "./landing-hero";
import { FeatureRail } from "./feature-rail";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  FileText,
  FlaskConical,
  LayoutPanelLeft,
  Save,
} from "lucide-react";
import {
  DEMO_ANALYSES_FR,
  getDemoById,
  isDemoId,
  type DemoAnalysis,
} from "@/lib/data/demo-analyses-fr";
import { trackEvent } from "@/lib/analytics";
import {
  getById,
  getHistorySnapshot,
  getHistoryServerSnapshot,
  newAnalysisId,
  saveAnalysis,
  subscribeToHistory,
  updateApplication,
} from "@/lib/storage/history";
import { StatusPill } from "@/components/application/status-pill";
import { TrackingCard } from "@/components/application/tracking-card";
import { GenerationCard } from "./generation-card";
import { QuickScanStrip } from "./quick-scan-strip";
import { SectionEyebrow } from "./section-eyebrow";
import { CollapsibleSection } from "./collapsible-section";
import type { ApplicationStatus } from "@/lib/schemas/analysis";
import type { JobAnalysis, StoredAnalysis } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type Status = "idle" | "loading" | "success";

type ApiSuccess = { analysis: JobAnalysis };
type ApiError = { error: { code: string; message: string } };

type MobileTab = "analysis" | "source";

export function AnalysisShell({ initialId }: { initialId: string | null }) {
  // The id we currently want to display. Starts from the URL prop, then can
  // be overridden after a successful submission or a "new analysis" reset.
  const [viewingId, setViewingId] = useState<string | null>(initialId);
  const [submitting, setSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("analysis");
  // A pre-computed example being previewed read-only. Never written to
  // history and never saved — clicking an example spends no API quota.
  const [demoEntry, setDemoEntry] = useState<StoredAnalysis | null>(null);
  // A fresh analysis awaiting an explicit "Enregistrer" — never saved
  // silently (brief Phase 4). Held in memory until the user saves it.
  const [pendingEntry, setPendingEntry] = useState<StoredAnalysis | null>(null);
  // The server (and thus the first client render) has no access to the
  // browser-stored analyses, so it always renders the idle landing. We mirror
  // that on the first client render and only read stored data after mount,
  // which avoids an SSR hydration mismatch on deep links (/?id=…).
  const [mounted, setMounted] = useState(false);

  // React 19 pattern for adjusting state when a prop changes during render —
  // avoids the setState-in-useEffect anti-pattern.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [trackedInitialId, setTrackedInitialId] = useState(initialId);
  if (trackedInitialId !== initialId) {
    setTrackedInitialId(initialId);
    setViewingId(initialId);
    if (initialId) {
      setDemoEntry(null);
      setPendingEntry(null);
    }
  }

  // Subscribe to history mutations so the displayed entry updates if the
  // user deletes / re-saves it from elsewhere (e.g. the history drawer).
  useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );

  const dataCurrent: StoredAnalysis | null =
    demoEntry ?? pendingEntry ?? (viewingId ? getById(viewingId) : null);
  // Null until mounted so SSR and the first client render agree (idle).
  const current: StoredAnalysis | null = mounted ? dataCurrent : null;
  const status: Status = submitting
    ? "loading"
    : current
    ? "success"
    : "idle";

  const openDemo = useCallback((id: string) => {
    const demo = getDemoById(id);
    if (!demo) return;
    setDemoEntry({
      id: demo.id,
      createdAt: Date.now(),
      jobText: demo.jobText,
      analysis: demo.analysis,
      isDemo: true,
    });
    setViewingId(null);
    setMobileTab("analysis");
    window.history.replaceState(null, "", `/?demo=${demo.id}`);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    trackEvent("demo_example_opened");
  }, []);

  const handleSubmit = useCallback(async (jobText: string) => {
    setDemoEntry(null);
    setPendingEntry(null);
    setSubmitting(true);
    trackEvent("analysis_started");
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
      // Hold the result in memory — the user saves it explicitly. No silent
      // write to history (brief Phase 4).
      const entry: StoredAnalysis = {
        id: newAnalysisId(),
        createdAt: Date.now(),
        jobText,
        analysis: data.analysis,
      };
      setViewingId(null);
      setPendingEntry(entry);
      setMobileTab("analysis");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.errors.analysisFailed;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Commit a pending analysis to history, with the (possibly edited)
  // company / job title captured as overrides. Called from a click handler,
  // so the saveAnalysis + setState happen outside React's render phase.
  const savePending = useCallback(
    (pending: StoredAnalysis, companyEdited: string, titleEdited: string) => {
      const meta = pending.analysis.meta;
      const company = companyEdited.trim();
      const title = titleEdited.trim();
      const companyChanged = company !== "" && company !== (meta.company ?? "");
      const titleChanged = title !== "" && title !== meta.title;
      const entry: StoredAnalysis = {
        ...pending,
        // Apply the edits onto meta so every card/list reflects them, and
        // keep the override fields as provenance that the user edited.
        analysis: {
          ...pending.analysis,
          meta: {
            ...meta,
            company: company !== "" ? company : meta.company,
            title: title !== "" ? title : meta.title,
          },
        },
        companyOverride: companyChanged ? company : undefined,
        titleOverride: titleChanged ? title : undefined,
      };
      saveAnalysis(entry);
      trackEvent("analysis_saved");
      setPendingEntry(null);
      setViewingId(entry.id);
      window.history.replaceState(null, "", `/?id=${entry.id}`);
    },
    []
  );

  const handleReset = useCallback(() => {
    setViewingId(null);
    setDemoEntry(null);
    setPendingEntry(null);
    setMobileTab("analysis");
    window.history.replaceState(null, "", "/");
  }, []);

  // Flip to client rendering after the first paint (see `mounted` above).
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Restore / deep-link an example from a `?demo=<id>` URL on first mount.
  const demoImportedRef = useRef(false);
  useEffect(() => {
    if (demoImportedRef.current) return;
    if (typeof window === "undefined") return;
    if (initialId) return;
    const demoParam = new URLSearchParams(window.location.search).get("demo");
    if (!demoParam) return;
    demoImportedRef.current = true;
    // Defer so this reads as "start a flow", not a synchronous state sync
    // (mirrors the `#analyze=` import effect below).
    queueMicrotask(() => openDemo(demoParam));
  }, [initialId, openDemo]);

  // One-shot import from a `#analyze=…` URL fragment — used by the Chrome
  // extension to push the scraped posting text. Runs once after mount,
  // strips the fragment so a refresh doesn't re-trigger.
  const importedRef = useRef(false);
  useEffect(() => {
    if (importedRef.current) return;
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = /^#analyze=(.+)$/.exec(hash);
    if (!match) return;
    importedRef.current = true;
    let decoded = "";
    try {
      decoded = decodeURIComponent(match[1]);
    } catch {
      return;
    }
    if (decoded.trim().length < 30) return;
    window.history.replaceState(null, "", "/");
    // Defer to a microtask so the lint rule doesn't flag this as a
    // setState-in-effect (handleSubmit transitively calls setSubmitting,
    // but here we're starting an async flow, not synchronously syncing
    // external state — the deferral makes that intent explicit).
    queueMicrotask(() => handleSubmit(decoded));
  }, [handleSubmit]);

  if (status === "idle") {
    return (
      <div className="relative">
        <div
          aria-hidden
          className="hero-bg pointer-events-none absolute inset-x-0 top-[-120px] -z-10 h-[640px]"
        />
        <div className="mx-auto max-w-3xl pt-2 sm:pt-6">
          <FollowupsToday />
          <LandingHero />
          <DemoExamples onOpen={openDemo} />
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

  // Read-only example view — no status/tracking/generation (those mutate
  // history or call the API), with a clear "this is an example" banner.
  if (isDemoId(current.id)) {
    return (
      <DemoAnalysisView
        entry={current}
        mobileTab={mobileTab}
        onTab={setMobileTab}
        onExit={handleReset}
      />
    );
  }

  // Fresh, not-yet-saved analysis: explicit "Enregistrer" + editable
  // company / title. Nothing has been written to history yet.
  if (pendingEntry && current.id === pendingEntry.id) {
    return (
      <PendingAnalysisView
        entry={current}
        mobileTab={mobileTab}
        onTab={setMobileTab}
        onSave={savePending}
        onDiscard={handleReset}
      />
    );
  }

  return (
    <HighlightProvider>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* LEFT — analysis */}
        <div
          className={cn(
            "flex flex-col gap-4",
            mobileTab === "source" && "hidden lg:flex"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="-ml-2"
            >
              <ArrowLeft className="size-4" />
              {t.form.newAnalysis}
            </Button>
            <div className="flex items-center gap-3">
              <StatusPill
                status={current.application?.status ?? "interested"}
                onChange={(next: ApplicationStatus) => {
                  updateApplication(current.id, {
                    status: next,
                    appliedAt:
                      next === "applied" &&
                      !current.application?.appliedAt
                        ? Date.now()
                        : current.application?.appliedAt ?? null,
                  });
                }}
              />
              <span className="text-muted-foreground text-xs">
                {new Date(current.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <MobileTabs tab={mobileTab} onChange={setMobileTab} />

          <VerdictHero
            entry={current}
            onScoreOverride={(n) =>
              saveAnalysis({ ...current, userScoreOverride: n })
            }
          />
          <QuickScanStrip entry={current} />
          <div className="-mt-1 flex flex-wrap gap-2">
            <GhostJobBadge
              analysis={current.analysis}
              jobText={current.jobText}
            />
          </div>

          <SectionEyebrow label={t.result.sections.realityCheck} />
          <RealityCheck
            entry={current}
            onContest={(phrase, next) => {
              const map = { ...(current.contestedSignals ?? {}) };
              if (next === null) delete map[phrase];
              else map[phrase] = next;
              saveAnalysis({ ...current, contestedSignals: map });
            }}
          />
          <FitScoreCard analysis={current.analysis} />
          <SalaryCard
            analysis={current.analysis}
            jobText={current.jobText}
          />

          <SectionEyebrow label={t.result.sections.context} />
          {current.analysis.company && (
            <CompanyCard company={current.analysis.company} />
          )}
          <SkillsSection skills={current.analysis.skills} />
          <MetaCard meta={current.analysis.meta} />

          <SectionEyebrow label={t.result.sections.nextSteps} />
          <CollapsibleSection
            title={t.result.sections.questionsTitle}
            hint={t.result.sections.questionsHint}
          >
            <QuestionsList entry={current} />
          </CollapsibleSection>
          <CollapsibleSection
            title={t.result.sections.generationTitle}
            hint={t.result.sections.generationHint}
          >
            <GenerationCard entry={current} />
          </CollapsibleSection>
          <CollapsibleSection
            title={t.result.sections.trackingTitle}
            hint={t.result.sections.trackingHint}
          >
            <TrackingCard entry={current} />
          </CollapsibleSection>
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

// ── Public examples ───────────────────────────────────────────────────

function DemoExamples({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section aria-label={t.landing.demo.heading} className="mb-8">
      <div className="mb-1 flex items-center gap-2">
        <FlaskConical className="size-4 text-[color:var(--accent-violet)]" />
        <p className="text-foreground text-sm font-medium">
          {t.landing.demo.heading}
        </p>
      </div>
      <p className="text-muted-foreground mb-3 text-sm">
        {t.landing.demo.subheading}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {DEMO_ANALYSES_FR.map((demo: DemoAnalysis) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => onOpen(demo.id)}
            aria-label={t.landing.demo.tryAria(demo.label)}
            className="group bg-card hover:border-[color:var(--accent-violet)]/50 flex min-h-[44px] flex-col items-start gap-0.5 rounded-xl border px-3.5 py-3 text-left transition-colors"
          >
            <span className="text-foreground text-sm font-medium">
              {demo.label}
            </span>
            <span className="text-muted-foreground text-xs">{demo.teaser}</span>
          </button>
        ))}
      </div>
      <p className="mono-hint mt-4">{t.landing.demo.ownLabel}</p>
    </section>
  );
}

function DemoAnalysisView({
  entry,
  mobileTab,
  onTab,
  onExit,
}: {
  entry: StoredAnalysis;
  mobileTab: MobileTab;
  onTab: (tab: MobileTab) => void;
  onExit: () => void;
}) {
  return (
    <HighlightProvider>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* LEFT — analysis */}
        <div
          className={cn(
            "flex flex-col gap-4",
            mobileTab === "source" && "hidden lg:flex"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="-ml-2 self-start"
          >
            <ArrowLeft className="size-4" />
            {t.landing.demo.bannerCta}
          </Button>

          <div className="rounded-xl border border-[color:var(--accent-violet)]/40 bg-[color:var(--accent-violet)]/5 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent-violet)]/15 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--accent-violet)]">
                <FlaskConical className="size-3" />
                {t.landing.demo.badge}
              </span>
              <p className="text-foreground text-sm font-medium">
                {t.landing.demo.bannerTitle}
              </p>
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {t.landing.demo.bannerBody}
            </p>
          </div>

          <MobileTabs tab={mobileTab} onChange={onTab} />

          <VerdictHero entry={entry} />
          <QuickScanStrip entry={entry} />
          <div className="-mt-1 flex flex-wrap gap-2">
            <GhostJobBadge analysis={entry.analysis} jobText={entry.jobText} />
          </div>

          <SectionEyebrow label={t.result.sections.realityCheck} />
          <RealityCheck entry={entry} />
          <FitScoreCard analysis={entry.analysis} />
          <SalaryCard analysis={entry.analysis} jobText={entry.jobText} />

          <SectionEyebrow label={t.result.sections.context} />
          {entry.analysis.company && (
            <CompanyCard company={entry.analysis.company} />
          )}
          <SkillsSection skills={entry.analysis.skills} />
          <MetaCard meta={entry.analysis.meta} />

          <SectionEyebrow label={t.result.sections.nextSteps} />
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold tracking-tight">
              {t.landing.demo.questionsTitle}
            </h3>
            <ul className="space-y-2">
              {entry.analysis.questionsToAsk.map((q, i) => (
                <li
                  key={i}
                  className="text-foreground/90 flex gap-2 text-sm leading-relaxed"
                >
                  <span
                    aria-hidden
                    className="text-[color:var(--accent-violet)] mt-0.5 select-none"
                  >
                    —
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-1">
            <Button onClick={onExit} className="gap-2">
              {t.landing.demo.bannerCta}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* RIGHT — source */}
        <aside
          className={cn(
            "bg-card rounded-lg border lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]",
            mobileTab === "analysis" && "hidden lg:block"
          )}
        >
          <div className="lg:hidden">
            <MobileTabs tab={mobileTab} onChange={onTab} />
          </div>
          <SourceHighlighter source={entry.jobText} />
        </aside>
      </div>
    </HighlightProvider>
  );
}

// ── Shared read-only analysis body (used by demo + unsaved views) ──────

function StaticQuestions({ questions }: { questions: string[] }) {
  if (questions.length === 0) return null;
  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold tracking-tight">
        {t.landing.demo.questionsTitle}
      </h3>
      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li
            key={i}
            className="text-foreground/90 flex gap-2 text-sm leading-relaxed"
          >
            <span
              aria-hidden
              className="text-[color:var(--accent-violet)] mt-0.5 select-none"
            >
              —
            </span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisReadonlyBody({ entry }: { entry: StoredAnalysis }) {
  return (
    <>
      <VerdictHero entry={entry} />
      <QuickScanStrip entry={entry} />
      <div className="-mt-1 flex flex-wrap gap-2">
        <GhostJobBadge analysis={entry.analysis} jobText={entry.jobText} />
      </div>
      <SectionEyebrow label={t.result.sections.realityCheck} />
      <RealityCheck entry={entry} />
      <FitScoreCard analysis={entry.analysis} />
      <SalaryCard analysis={entry.analysis} jobText={entry.jobText} />
      <SectionEyebrow label={t.result.sections.context} />
      {entry.analysis.company && <CompanyCard company={entry.analysis.company} />}
      <SkillsSection skills={entry.analysis.skills} />
      <MetaCard meta={entry.analysis.meta} />
      <SectionEyebrow label={t.result.sections.nextSteps} />
      <StaticQuestions questions={entry.analysis.questionsToAsk} />
    </>
  );
}

// ── Unsaved analysis: explicit save + editable entreprise / poste ──────

function PendingAnalysisView({
  entry,
  mobileTab,
  onTab,
  onSave,
  onDiscard,
}: {
  entry: StoredAnalysis;
  mobileTab: MobileTab;
  onTab: (tab: MobileTab) => void;
  onSave: (entry: StoredAnalysis, company: string, title: string) => void;
  onDiscard: () => void;
}) {
  const meta = entry.analysis.meta;
  const [company, setCompany] = useState(meta.company ?? "");
  const [title, setTitle] = useState(meta.title);

  return (
    <HighlightProvider>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div
          className={cn(
            "flex flex-col gap-4",
            mobileTab === "source" && "hidden lg:flex"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            className="-ml-2 self-start"
          >
            <ArrowLeft className="size-4" />
            {t.form.newAnalysis}
          </Button>

          {/* Save bar — editable company / title, explicit save */}
          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <p className="text-foreground mb-3 text-sm font-medium">
              {t.save.title}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-muted-foreground mb-1 block text-[11px] font-medium uppercase tracking-wider">
                  {t.save.companyLabel}
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t.save.companyPlaceholder}
                  className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full rounded-md border px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
                />
              </label>
              <label className="block">
                <span className="text-muted-foreground mb-1 block text-[11px] font-medium uppercase tracking-wider">
                  {t.save.titleLabel}
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.save.titlePlaceholder}
                  className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full rounded-md border px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={() => onSave(entry, company, title)}
                className="gap-2"
              >
                <Save className="size-4" />
                {t.save.cta}
              </Button>
              <Button variant="ghost" onClick={onDiscard}>
                {t.save.discard}
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-[11px]">
              {t.save.hint}
            </p>
          </div>

          <MobileTabs tab={mobileTab} onChange={onTab} />
          <AnalysisReadonlyBody entry={entry} />
        </div>

        <aside
          className={cn(
            "bg-card rounded-lg border lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]",
            mobileTab === "analysis" && "hidden lg:block"
          )}
        >
          <div className="lg:hidden">
            <MobileTabs tab={mobileTab} onChange={onTab} />
          </div>
          <SourceHighlighter source={entry.jobText} />
        </aside>
      </div>
    </HighlightProvider>
  );
}

// ── "À relancer aujourd'hui" opening screen ───────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

// Wrapped so the React purity lint rule doesn't flag the Date call in render
// (same pattern as nowMs() elsewhere in the app).
function nowMs(): number {
  return Date.now();
}

function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function FollowupsToday() {
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );

  const cutoff = endOfToday();
  const due = items
    .filter((e) => {
      const d = e.application?.followUpDate;
      return typeof d === "number" && d <= cutoff;
    })
    .sort(
      (a, b) =>
        (a.application?.followUpDate ?? 0) - (b.application?.followUpDate ?? 0)
    );

  if (due.length === 0) return null;

  const now = nowMs();

  return (
    <section
      aria-label={t.followups.title}
      className="border-amber-500/30 bg-amber-500/5 mb-8 rounded-xl border p-4"
    >
      <header className="text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
        <BellRing className="size-3.5" />
        {t.followups.title}
      </header>
      <ul className="space-y-1.5">
        {due.map((e) => {
          const label =
            e.companyOverride ??
            e.analysis.meta.company ??
            e.titleOverride ??
            e.analysis.meta.title;
          const d = e.application!.followUpDate!;
          const overdueDays = Math.floor((now - d) / DAY_MS);
          return (
            <li key={e.id}>
              <Link
                href={`/?id=${e.id}`}
                className="hover:bg-amber-500/10 -mx-2 flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors"
              >
                <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                  {label}
                </span>
                <span className="text-amber-700 dark:text-amber-400 shrink-0 text-xs font-medium">
                  {overdueDays > 0
                    ? t.followups.overdue(overdueDays)
                    : t.followups.today}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
