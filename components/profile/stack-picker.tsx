"use client";

import { useMemo, useState } from "react";
import { Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  searchStacks,
  labelFor,
} from "@/lib/data/tech-stacks";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface StackPickerProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
}

export function StackPicker({ value, onChange }: StackPickerProps) {
  const [query, setQuery] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState("");

  const grouped = useMemo(() => searchStacks(query), [query]);
  const selected = new Set(value);

  const toggle = (id: string) => {
    if (selected.has(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const removeOne = (id: string) => onChange(value.filter((v) => v !== id));

  const addCustom = () => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    const id = `custom:${trimmed}`;
    if (!selected.has(id)) onChange([...value, id]);
    setCustomDraft("");
    setShowCustom(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id}>
              <span
                className={cn(
                  "border-foreground/15 bg-card inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
                  id.startsWith("custom:") && "border-dashed"
                )}
              >
                {labelFor(id)}
                <button
                  type="button"
                  onClick={() => removeOne(id)}
                  aria-label={`Remove ${labelFor(id)}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground/70 text-xs">
          {t.profile.sections.stack.empty}
        </p>
      )}

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.profile.sections.stack.searchPlaceholder}
        className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
      />

      {/* Grouped results */}
      <div className="max-h-56 overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <p className="text-muted-foreground py-3 text-center text-xs">
            No matches.
          </p>
        ) : (
          <div className="space-y-3">
            {grouped.map((group) => (
              <section key={group.category}>
                <h4 className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-wider">
                  {group.label}
                </h4>
                <ul className="flex flex-wrap gap-1.5">
                  {group.entries.map((entry) => {
                    const isSelected = selected.has(entry.id);
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => toggle(entry.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/40 hover:bg-muted/50"
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                          {entry.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Custom add */}
      {showCustom ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              } else if (e.key === "Escape") {
                setShowCustom(false);
                setCustomDraft("");
              }
            }}
            placeholder={t.profile.sections.stack.customPlaceholder}
            autoFocus
            className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
          />
          <Button type="button" size="sm" onClick={addCustom}>
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowCustom(false);
              setCustomDraft("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowCustom(true)}
        >
          <Plus className="size-3.5" />
          {t.profile.sections.stack.addCustom}
        </Button>
      )}
    </div>
  );
}
