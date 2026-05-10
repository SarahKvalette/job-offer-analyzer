"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Trash2, FileText, Search, X, History, Clock } from "lucide-react";
import {
  deleteAnalysis,
  getHistory,
  subscribeToHistory,
} from "@/lib/storage/history";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { computeFallbackVerdict, sentimentMeta } from "@/lib/analysis/verdict";
import { cn } from "@/lib/utils";

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

type Group = { label: string; items: StoredAnalysis[] };

function groupItems(items: StoredAnalysis[]): Group[] {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const groups: Record<string, StoredAnalysis[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };

  for (const item of items) {
    if (item.createdAt >= startOfToday) groups.Today.push(item);
    else if (item.createdAt >= startOfYesterday) groups.Yesterday.push(item);
    else if (item.createdAt >= startOfWeek) groups["This week"].push(item);
    else groups.Older.push(item);
  }

  return (Object.entries(groups) as [string, StoredAnalysis[]][])
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, items: list }));
}

export function HistoryDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StoredAnalysis[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const params = useSearchParams();
  const activeId = params.get("id");

  useEffect(() => {
    setItems(getHistory());
    setHydrated(true);
    return subscribeToHistory(() => setItems(getHistory()));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((entry) => {
      const m = entry.analysis.meta;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.company ?? "").toLowerCase().includes(q) ||
        (m.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const groups = useMemo(() => groupItems(filtered), [filtered]);
  const count = hydrated ? items.length : 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button variant="ghost" size="sm" aria-label="Open history">
            <History className="size-4" />
            <span className="hidden sm:inline">History</span>
            {count > 0 && (
              <span className="bg-primary/15 text-primary ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                {count}
              </span>
            )}
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-40 bg-black/40 backdrop-blur-sm duration-200" />
        <Dialog.Popup
          className={cn(
            "bg-background ring-border/60 fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col ring-1",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            "duration-300"
          )}
        >
          <header className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <Clock className="size-4" />
                History
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-0.5 text-xs">
                Last 10 analyses, kept locally in your browser.
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Close">
                  <X className="size-4" />
                </Button>
              }
            />
          </header>

          {items.length > 1 && (
            <div className="border-b px-5 py-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, company, location…"
                  className="bg-muted/40 border-input/60 focus-visible:bg-background focus-visible:ring-primary/30 w-full rounded-lg border py-2 pl-8 pr-8 text-sm outline-none transition-colors focus-visible:ring-2"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            {!hydrated ? (
              <p className="text-muted-foreground px-5 py-6 text-xs">
                Loading…
              </p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="bg-muted/50 ring-border mb-3 flex size-12 items-center justify-center rounded-2xl ring-1">
                  <FileText className="text-muted-foreground size-5" />
                </div>
                <p className="text-foreground text-sm font-medium">
                  {items.length === 0 ? "No analyses yet" : "No matches"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {items.length === 0
                    ? "Your analyses will appear here."
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-3">
                {groups.map((group) => (
                  <section key={group.label}>
                    <h3 className="text-muted-foreground px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider">
                      {group.label}
                    </h3>
                    <ul className="px-2.5">
                      {group.items.map((entry) => {
                        const isActive = entry.id === activeId;
                        const verdict = computeFallbackVerdict(entry.analysis);
                        const tone = sentimentMeta[verdict.sentiment].tone;
                        return (
                          <li key={entry.id} className="group">
                            <Link
                              href={`/?id=${entry.id}`}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "hover:bg-muted/60 flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors",
                                isActive && "bg-muted ring-border ring-1"
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                                  "bg-muted/60 ring-border ring-1",
                                  tone
                                )}
                                title={`${verdict.sentiment} · ${verdict.score}/10`}
                              >
                                {verdict.score}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium leading-tight">
                                  {entry.analysis.meta.title}
                                </p>
                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                  {entry.analysis.meta.company ?? "Unknown"} ·{" "}
                                  {formatRelative(entry.createdAt)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                onClick={(e) => {
                                  e.preventDefault();
                                  deleteAnalysis(entry.id);
                                }}
                                aria-label="Delete analysis"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </ScrollArea>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
