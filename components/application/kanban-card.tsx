"use client";

import Link from "next/link";
import { Trash2, Calendar, Tag } from "lucide-react";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { Button } from "@/components/ui/button";
import { computeFallbackVerdict, sentimentMeta } from "@/lib/analysis/verdict";
import { cn } from "@/lib/utils";

export function KanbanCard({
  entry,
  selected,
  onToggleSelect,
  onDelete,
  onDragStart,
  onDragEnd,
  draggable,
}: {
  entry: StoredAnalysis;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  draggable: boolean;
}) {
  const verdict = computeFallbackVerdict(entry.analysis);
  const tone = sentimentMeta[verdict.sentiment].tone;
  const meta = entry.analysis.meta;
  const app = entry.application;
  const tags = app?.tags ?? [];

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group bg-card relative rounded-lg border p-3 shadow-sm transition-all",
        "hover:shadow-md",
        draggable && "cursor-grab active:cursor-grabbing",
        selected && "ring-primary ring-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/?id=${entry.id}`}
            className="text-foreground hover:underline text-sm font-medium leading-snug"
          >
            {meta.title}
          </Link>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {meta.company ?? "Unknown"}
            {meta.location ? ` · ${meta.location}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSelect}
          className={cn(
            "shrink-0 rounded border-2 transition-colors",
            "size-4",
            selected
              ? "border-primary bg-primary"
              : "border-muted-foreground/30 hover:border-foreground/60"
          )}
          aria-label={selected ? "Deselect" : "Select"}
          aria-pressed={selected}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "bg-muted/60 ring-border inline-flex size-7 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ring-1 tabular-nums",
            tone
          )}
          title={`Verdict ${verdict.score}/10`}
        >
          {verdict.score}
        </span>
        {tags.length > 0 && (
          <ul className="flex min-w-0 flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="bg-muted text-muted-foreground inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]"
              >
                <Tag className="size-2.5" />
                {tag}
              </li>
            ))}
            {tags.length > 3 && (
              <li className="text-muted-foreground text-[10px]">
                +{tags.length - 3}
              </li>
            )}
          </ul>
        )}
      </div>

      {app?.nextAction && (
        <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[11px]">
          <Calendar className="size-3" />
          <span className="truncate">{app.nextAction.description}</span>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete();
        }}
        aria-label="Delete analysis"
      >
        <Trash2 className="size-3" />
      </Button>
    </article>
  );
}
