"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Native-feeling disclosure for the heavier "next steps" cards
 * (Questions, Generation, Tracking). Collapsed by default — these are
 * post-decision actions and shouldn't dominate the initial scan.
 *
 * Built on a regular button + state rather than `<details>` so the open
 * animations and ARIA wiring stay consistent with the rest of the app.
 */
export function CollapsibleSection({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-border bg-card/30 rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors"
      >
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold tracking-tight">
            {title}
          </h2>
          {hint && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {hint}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
    </section>
  );
}
