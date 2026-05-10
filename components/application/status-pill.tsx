"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown } from "lucide-react";
import type { ApplicationStatus } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ignored",
];

const TONE: Record<
  ApplicationStatus,
  { dot: string; text: string; ring: string }
> = {
  interested: {
    dot: "bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-500/30",
  },
  applied: {
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500/30",
  },
  interview: {
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-500/30",
  },
  offer: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/30",
  },
  rejected: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-500/30",
  },
  ignored: {
    dot: "bg-zinc-400",
    text: "text-zinc-500 dark:text-zinc-400",
    ring: "ring-zinc-400/20",
  },
};

export function StatusPill({
  status,
  onChange,
  size = "sm",
}: {
  status: ApplicationStatus;
  onChange: (next: ApplicationStatus) => void;
  size?: "sm" | "md";
}) {
  const tone = TONE[status];
  const label = t.application.statuses[status];

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "bg-card inline-flex items-center gap-1.5 rounded-full border ring-1 transition-colors",
          tone.ring,
          tone.text,
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
          "hover:ring-2"
        )}
        aria-label={t.application.statusChange}
      >
        <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
        <span className="font-medium">{label}</span>
        <ChevronDown className="size-3 opacity-60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start">
          <Popover.Popup
            className={cn(
              "bg-popover ring-border/60 z-50 w-44 rounded-lg p-1 shadow-xl ring-1",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out data-[state=open]:fade-in",
              "data-[state=open]:zoom-in-95 duration-150"
            )}
          >
            <ul>
              {STATUSES.map((s) => {
                const stone = TONE[s];
                const active = s === status;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => onChange(s)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active ? "bg-muted/60" : "hover:bg-muted/40"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn("size-1.5 rounded-full", stone.dot)}
                      />
                      <span className={cn("flex-1 text-left", stone.text)}>
                        {t.application.statuses[s]}
                      </span>
                      {active && <Check className="size-3.5" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
