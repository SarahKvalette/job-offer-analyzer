"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Trash2, FileText } from "lucide-react";
import {
  deleteAnalysis,
  getHistory,
  subscribeToHistory,
} from "@/lib/storage/history";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function HistorySidebar() {
  const [items, setItems] = useState<StoredAnalysis[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const params = useSearchParams();
  const activeId = params.get("id");

  useEffect(() => {
    setItems(getHistory());
    setHydrated(true);
    return subscribeToHistory(() => setItems(getHistory()));
  }, []);

  if (!hydrated) {
    return (
      <aside className="bg-card hidden w-64 shrink-0 border-r p-4 lg:block">
        <p className="text-muted-foreground text-xs">Loading history…</p>
      </aside>
    );
  }

  return (
    <aside className="bg-card hidden w-64 shrink-0 flex-col border-r lg:flex">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">History</h2>
        <p className="text-muted-foreground text-xs">
          Last 10 analyses, kept locally.
        </p>
      </header>
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-xs">
            No analyses yet.
          </p>
        ) : (
          <ul className="px-2 py-2">
            {items.map((entry) => {
              const isActive = entry.id === activeId;
              return (
                <li key={entry.id} className="group">
                  <Link
                    href={`/?id=${entry.id}`}
                    className={cn(
                      "hover:bg-muted/60 flex items-start gap-2 rounded-md px-2 py-2 transition-colors",
                      isActive && "bg-muted"
                    )}
                  >
                    <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {entry.analysis.meta.title}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {entry.analysis.meta.company ?? "Unknown company"} ·{" "}
                        {formatRelative(entry.createdAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
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
        )}
      </ScrollArea>
    </aside>
  );
}
