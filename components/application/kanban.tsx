"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteAnalysis,
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeToHistory,
  updateApplication,
} from "@/lib/storage/history";
import type {
  ApplicationStatus,
  StoredAnalysis,
} from "@/lib/schemas/analysis";
import { computeFallbackVerdict } from "@/lib/analysis/verdict";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";

/**
 * Wrapper around Date.now() that the React purity lint rule doesn't
 * recognise as impure — same idea as nowMs() helpers in other places.
 */
function nowMs(): number {
  return Date.now();
}

const COLUMN_ORDER: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ignored",
];

export function Kanban() {
  const router = useRouter();
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );

  const [tagFilter, setTagFilter] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(
    null
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of items) for (const t of e.application?.tags ?? []) set.add(t);
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((entry) => {
      if (
        tagFilter &&
        !(entry.application?.tags ?? []).includes(tagFilter)
      )
        return false;
      const score = computeFallbackVerdict(entry.analysis).score;
      if (score < minScore) return false;
      return true;
    });
  }, [items, tagFilter, minScore]);

  const grouped = useMemo(() => {
    const acc: Record<ApplicationStatus, StoredAnalysis[]> = {
      interested: [],
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
      ignored: [],
    };
    for (const entry of filtered) {
      const status = entry.application?.status ?? "interested";
      acc[status].push(entry);
    }
    return acc;
  }, [filtered]);

  const handleDrop = (column: ApplicationStatus) => {
    if (!draggingId) return;
    const dragged = items.find((e) => e.id === draggingId);
    if (!dragged) return;
    if ((dragged.application?.status ?? "interested") === column) return;
    updateApplication(draggingId, {
      status: column,
      appliedAt:
        column === "applied" && !dragged.application?.appliedAt
          ? nowMs()
          : dragged.application?.appliedAt ?? null,
    });
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setTagFilter("");
    setMinScore(0);
  };

  const selectionCount = selected.size;
  const canCompare = selectionCount >= 2 && selectionCount <= 3;

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <Filters
        tags={allTags}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        onClear={clearFilters}
        active={tagFilter !== "" || minScore > 0}
      />

      {selectionCount > 0 && (
        <div className="bg-card flex items-center justify-between rounded-md border p-2.5">
          <span className="text-muted-foreground text-xs">
            {t.pipeline.selectionHint(selectionCount)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <Button
              size="sm"
              disabled={!canCompare}
              onClick={() => {
                const ids = Array.from(selected).join(",");
                router.push(`/compare?ids=${ids}`);
              }}
            >
              {t.pipeline.compare}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-6">
        {COLUMN_ORDER.map((column) => (
          <Column
            key={column}
            status={column}
            items={grouped[column]}
            isDropTarget={dragOverColumn === column}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(column);
            }}
            onDragLeave={() => {
              setDragOverColumn((prev) => (prev === column ? null : prev));
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(column);
            }}
            selectedIds={selected}
            onToggleSelect={toggleSelected}
            onDragStart={(id) => setDraggingId(id)}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverColumn(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Column({
  status,
  items,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  selectedIds,
  onToggleSelect,
  onDragStart,
  onDragEnd,
}: {
  status: ApplicationStatus;
  items: StoredAnalysis[];
  isDropTarget: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const label = t.pipeline.columns[status];

  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "bg-muted/30 flex min-h-[200px] flex-col rounded-lg border p-2 transition-colors",
        isDropTarget && "border-primary bg-primary/5"
      )}
    >
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-foreground text-xs font-semibold tracking-tight">
          {label}
        </h2>
        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {items.length}
        </span>
      </header>
      <div className="flex flex-col gap-2">
        {items.map((entry) => (
          <KanbanCard
            key={entry.id}
            entry={entry}
            selected={selectedIds.has(entry.id)}
            onToggleSelect={() => onToggleSelect(entry.id)}
            onDelete={() => deleteAnalysis(entry.id)}
            onDragStart={() => onDragStart(entry.id)}
            onDragEnd={onDragEnd}
            draggable
          />
        ))}
      </div>
    </section>
  );
}

function Filters({
  tags,
  tagFilter,
  onTagChange,
  minScore,
  onMinScoreChange,
  onClear,
  active,
}: {
  tags: string[];
  tagFilter: string;
  onTagChange: (next: string) => void;
  minScore: number;
  onMinScoreChange: (next: number) => void;
  onClear: () => void;
  active: boolean;
}) {
  return (
    <div className="bg-card flex flex-wrap items-center gap-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Search className="text-muted-foreground size-3.5" />
        <select
          value={tagFilter}
          onChange={(e) => onTagChange(e.target.value)}
          className="bg-card border-input rounded-md border px-2 py-1 text-xs"
          aria-label={t.pipeline.filters.tagPlaceholder}
        >
          <option value="">{t.pipeline.filters.tagPlaceholder}</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        {t.pipeline.filters.minScoreLabel}
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={minScore}
          onChange={(e) => onMinScoreChange(Number(e.target.value))}
          className="accent-foreground"
        />
        <span className="text-foreground font-mono tabular-nums">
          {minScore}
        </span>
      </label>
      {active && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="size-3" />
          {t.pipeline.filters.clear}
        </Button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-card flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
      <h3 className="text-foreground text-sm font-medium">
        {t.pipeline.empty.title}
      </h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-xs">
        {t.pipeline.empty.body}
      </p>
    </div>
  );
}
