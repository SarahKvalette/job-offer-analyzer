"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
  ariaLabel?: string;
}

/**
 * Free-form tag input. Press Enter (or comma) to add the current draft as
 * a tag; click the × to remove. Used for zones, languages, deal-breakers,
 * and the custom-tech sub-input.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  hint,
  ariaLabel,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div>
      <div
        className={cn(
          "bg-card border-input flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5",
          "focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-2"
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-muted text-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (
              e.key === "Backspace" &&
              draft.length === 0 &&
              value.length > 0
            ) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ""}
          aria-label={ariaLabel}
          className="placeholder:text-muted-foreground/60 min-w-[80px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {hint && (
        <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p>
      )}
    </div>
  );
}
