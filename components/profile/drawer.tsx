"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRef, useState, useSyncExternalStore } from "react";
import { Check, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getProfileSnapshot,
  getProfileServerSnapshot,
  resetProfile,
  subscribeToProfile,
  updateProfile,
} from "@/lib/storage/profile";
import type { UserProfile, ProfileWeights } from "@/lib/schemas/profile";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { StackPicker } from "./stack-picker";
import { TagInput } from "./tag-input";
import { WeightSlider } from "./weight-slider";
import { CvSection } from "./cv-section";
import { GoogleSection } from "./google-section";

const NO_OP = () => () => {};

export function ProfileDrawer() {
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mounted check (avoids SSR mismatch on the trigger badge dot).
  const mounted = useSyncExternalStore(
    NO_OP,
    () => true,
    () => false
  );

  const profile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const persist = (patch: Partial<UserProfile>) => {
    updateProfile(patch);
    setShowSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setShowSaved(false), 1500);
  };

  const updateWeight = (key: keyof ProfileWeights, value: number) => {
    persist({ weights: { ...profile.weights, [key]: value } });
  };

  const customised = mounted && profileHasContent(profile);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t.profile.actions.exportFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    resetProfile();
    setResetOpen(false);
    setShowSaved(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          render={
            <Button
              variant="ghost"
              size="sm"
              aria-label={t.profile.triggerAria}
            >
              <User className="size-4" />
              <span className="hidden sm:inline">{t.profile.triggerLabel}</span>
              {customised && (
                <span
                  aria-hidden
                  className="bg-emerald-500 ml-0.5 size-1.5 rounded-full"
                />
              )}
            </Button>
          }
        />
        <Dialog.Portal>
          <Dialog.Backdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-40 bg-black/40 backdrop-blur-sm duration-200" />
          <Dialog.Popup
            className={cn(
              "bg-background ring-border/60 fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col ring-1",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
              "duration-300"
            )}
          >
            <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <Dialog.Title className="flex items-center gap-2 text-base font-semibold tracking-tight">
                  <User className="size-4" />
                  {t.profile.title}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mt-0.5 text-xs">
                  {t.profile.subtitle}
                </Dialog.Description>
              </div>
              <div className="flex items-center gap-2">
                {showSaved && (
                  <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 text-[11px] font-medium">
                    <Check className="size-3" />
                    {t.profile.actions.saved}
                  </span>
                )}
                <Dialog.Close
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.profile.close}
                    >
                      <X className="size-4" />
                    </Button>
                  }
                />
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="space-y-7 px-5 py-5">
                {/* Stack */}
                <Section
                  title={t.profile.sections.stack.title}
                  hint={t.profile.sections.stack.hint}
                >
                  <StackPicker
                    value={profile.stack}
                    onChange={(next) => persist({ stack: next })}
                  />
                </Section>

                {/* Experience */}
                <Section title={t.profile.sections.experience.title}>
                  <Field label={t.profile.sections.experience.yearsLabel}>
                    <NumberInput
                      value={profile.yearsExperience}
                      min={0}
                      max={60}
                      onCommit={(n) => persist({ yearsExperience: n })}
                    />
                  </Field>
                </Section>

                {/* Compensation */}
                <Section title={t.profile.sections.compensation.title}>
                  <Field label={t.profile.sections.compensation.minLabel}>
                    <SalaryInput
                      value={profile.minSalary}
                      onChange={(next) => persist({ minSalary: next })}
                    />
                  </Field>
                </Section>

                {/* Modalities */}
                <Section title={t.profile.sections.modalities.title}>
                  <Field
                    label={t.profile.sections.modalities.remoteLabel}
                  >
                    <RemoteRadioGroup
                      value={profile.remotePreference}
                      onChange={(next) =>
                        persist({ remotePreference: next })
                      }
                    />
                  </Field>
                  <Field
                    label={t.profile.sections.modalities.locationLabel}
                  >
                    <TextInput
                      value={profile.location}
                      placeholder={
                        t.profile.sections.modalities.locationPlaceholder
                      }
                      onCommit={(s) => persist({ location: s })}
                    />
                  </Field>
                  <Field
                    label={t.profile.sections.modalities.zonesLabel}
                  >
                    <TagInput
                      value={profile.acceptedZones}
                      onChange={(next) => persist({ acceptedZones: next })}
                      placeholder={t.profile.sections.modalities.zonesPlaceholder}
                      hint={t.profile.sections.modalities.zonesHint}
                    />
                  </Field>
                </Section>

                {/* Languages */}
                <Section title={t.profile.sections.languages.title}>
                  <TagInput
                    value={profile.languages}
                    onChange={(next) => persist({ languages: next })}
                    placeholder={t.profile.sections.languages.placeholder}
                    hint={t.profile.sections.languages.hint}
                  />
                </Section>

                {/* Deal-breakers */}
                <Section title={t.profile.sections.dealBreakers.title}>
                  <TagInput
                    value={profile.dealBreakers}
                    onChange={(next) => persist({ dealBreakers: next })}
                    placeholder={t.profile.sections.dealBreakers.placeholder}
                    hint={t.profile.sections.dealBreakers.hint}
                  />
                </Section>

                {/* Google */}
                <GoogleSection />

                {/* CV */}
                <CvSection />

                {/* Weights */}
                <Section
                  title={t.profile.sections.weights.title}
                  hint={t.profile.sections.weights.hint}
                >
                  <div className="space-y-3.5">
                    {(
                      Object.entries(t.profile.sections.weights.labels) as Array<
                        [keyof ProfileWeights, string]
                      >
                    ).map(([key, label]) => (
                      <WeightSlider
                        key={key}
                        label={label}
                        value={profile.weights[key]}
                        onChange={(n) => updateWeight(key, n)}
                      />
                    ))}
                  </div>
                </Section>
              </div>
            </ScrollArea>

            <footer className="flex items-center justify-between gap-2 border-t px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetOpen(true)}
                disabled={!customised}
              >
                {t.profile.actions.reset}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!customised}
              >
                {t.profile.actions.export}
              </Button>
            </footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reset confirmation */}
      <Dialog.Root open={resetOpen} onOpenChange={setResetOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-50 bg-black/50 backdrop-blur-sm duration-150" />
          <Dialog.Popup
            className={cn(
              "bg-background ring-border/60 fixed left-1/2 top-1/2 z-[60] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 shadow-xl ring-1",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
              "duration-150"
            )}
          >
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t.profile.actions.resetConfirm}
            </Dialog.Title>
            <Dialog.Description className="text-muted-foreground mt-2 text-sm">
              {t.profile.actions.resetConfirmDesc}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button variant="ghost" size="sm">
                    {t.profile.actions.cancel}
                  </Button>
                }
              />
              <Button variant="destructive" size="sm" onClick={handleReset}>
                {t.profile.actions.confirmReset}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function profileHasContent(profile: UserProfile): boolean {
  return (
    profile.stack.length > 0 ||
    profile.yearsExperience > 0 ||
    profile.minSalary !== null ||
    profile.remotePreference !== "any" ||
    profile.location !== "" ||
    profile.acceptedZones.length > 0 ||
    profile.languages.length > 0 ||
    profile.dealBreakers.length > 0
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-foreground text-sm font-semibold tracking-tight">
        {title}
      </h3>
      {hint && (
        <p className="text-muted-foreground mb-2 mt-0.5 text-[11px] leading-relaxed">
          {hint}
        </p>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-[11px] font-medium uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  // Keep local draft synced when external value changes (e.g. reset).
  if (draft !== value && document.activeElement?.tagName !== "INPUT") {
    setDraft(value);
  }
  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder={placeholder}
      className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full rounded-md border px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
    />
  );
}

function NumberInput({
  value,
  min,
  max,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  if (draft !== String(value) && document.activeElement?.tagName !== "INPUT") {
    setDraft(String(value));
  }
  return (
    <input
      type="number"
      value={draft}
      min={min}
      max={max}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = parseFloat(draft);
        if (Number.isFinite(n)) {
          const clamped = Math.max(min, Math.min(max, n));
          if (clamped !== value) onCommit(clamped);
        } else {
          setDraft(String(value));
        }
      }}
      className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-24 rounded-md border px-3 py-1.5 text-sm tabular-nums outline-none focus-visible:ring-2"
    />
  );
}

function SalaryInput({
  value,
  onChange,
}: {
  value: UserProfile["minSalary"];
  onChange: (next: UserProfile["minSalary"]) => void;
}) {
  const amount = value?.amount ?? 0;
  const currency = value?.currency ?? "EUR";
  const period = value?.period ?? "year";
  const [draft, setDraft] = useState(amount > 0 ? String(amount) : "");
  if (
    draft !== (amount > 0 ? String(amount) : "") &&
    document.activeElement?.tagName !== "INPUT"
  ) {
    setDraft(amount > 0 ? String(amount) : "");
  }

  const commitAmount = () => {
    const n = parseFloat(draft.replace(/[^\d.]/g, ""));
    if (Number.isFinite(n) && n > 0) {
      onChange({ amount: Math.round(n), currency, period });
    } else if (draft.trim() === "") {
      onChange(null);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitAmount}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={t.profile.sections.compensation.amountPlaceholder}
        className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring rounded-md border px-3 py-1.5 text-sm tabular-nums outline-none focus-visible:ring-2"
        aria-label={t.profile.sections.compensation.minLabel}
      />
      <select
        value={currency}
        onChange={(e) => {
          const next = e.target.value as "EUR" | "USD" | "GBP";
          if (value)
            onChange({ ...value, currency: next });
          else if (draft) {
            const n = parseFloat(draft);
            if (Number.isFinite(n))
              onChange({ amount: Math.round(n), currency: next, period });
          }
        }}
        className="bg-card border-input rounded-md border px-2 py-1.5 text-sm outline-none"
        aria-label={t.profile.sections.compensation.currency}
      >
        <option value="EUR">€ EUR</option>
        <option value="USD">$ USD</option>
        <option value="GBP">£ GBP</option>
      </select>
      <select
        value={period}
        onChange={(e) => {
          const next = e.target.value as "year" | "month" | "day";
          if (value) onChange({ ...value, period: next });
          else if (draft) {
            const n = parseFloat(draft);
            if (Number.isFinite(n))
              onChange({ amount: Math.round(n), currency, period: next });
          }
        }}
        className="bg-card border-input rounded-md border px-2 py-1.5 text-sm outline-none"
        aria-label={t.profile.sections.compensation.period}
      >
        <option value="year">
          {t.profile.sections.compensation.periods.year}
        </option>
        <option value="month">
          {t.profile.sections.compensation.periods.month}
        </option>
        <option value="day">
          {t.profile.sections.compensation.periods.day}
        </option>
      </select>
    </div>
  );
}

function RemoteRadioGroup({
  value,
  onChange,
}: {
  value: UserProfile["remotePreference"];
  onChange: (next: UserProfile["remotePreference"]) => void;
}) {
  const options: Array<{
    id: UserProfile["remotePreference"];
    label: string;
  }> = [
    { id: "any", label: t.profile.sections.modalities.remoteOptions.any },
    { id: "full", label: t.profile.sections.modalities.remoteOptions.full },
    { id: "hybrid", label: t.profile.sections.modalities.remoteOptions.hybrid },
    { id: "onsite", label: t.profile.sections.modalities.remoteOptions.onsite },
  ];
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/40 hover:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
