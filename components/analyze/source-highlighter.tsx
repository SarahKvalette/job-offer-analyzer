"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHighlight } from "@/components/analyze/highlight-context";
import { locateQuote } from "@/lib/analysis/verify-evidence";
import { t } from "@/lib/i18n";

type Segment = { text: string; highlighted: boolean };

function findSegments(source: string, needle: string | null): Segment[] {
  if (!needle || needle.length === 0) {
    return [{ text: source, highlighted: false }];
  }
  // French-tolerant location: matches across non-breaking spaces, curly
  // apostrophes, accents and « » even when the model's quote differs slightly.
  const loc = locateQuote(source, needle);
  if (!loc) {
    return [{ text: source, highlighted: false }];
  }
  return [
    { text: source.slice(0, loc.start), highlighted: false },
    { text: source.slice(loc.start, loc.end), highlighted: true },
    { text: source.slice(loc.end), highlighted: false },
  ];
}

export function SourceHighlighter({ source }: { source: string }) {
  const { active } = useHighlight();
  const segments = useMemo(() => findSegments(source, active), [source, active]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{t.result.source.title}</h2>
        <p className="text-muted-foreground text-xs">
          {t.result.source.subtitle}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <pre className="text-foreground/90 font-sans px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap">
          {segments.map((seg, i) =>
            seg.highlighted ? (
              <mark
                key={i}
                className="bg-primary/30 text-foreground rounded px-0.5"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </pre>
      </ScrollArea>
    </div>
  );
}
