import { cn } from "@/lib/utils";

/**
 * Tiny header that slices the analysis result view into thematic chunks
 * — "Reality check", "Context", "Next steps". Keeps the long scroll
 * scannable by anchoring the eye to a label every few cards.
 */
export function SectionEyebrow({
  label,
  count,
  className,
}: {
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/60 mt-2 flex items-baseline gap-2 border-t pt-3",
        className
      )}
    >
      <span className="text-muted-foreground font-mono text-[10px] font-medium uppercase tracking-[0.15em]">
        {label}
      </span>
      {typeof count === "number" && (
        <span className="text-muted-foreground/60 font-mono text-[10px]">
          · {count}
        </span>
      )}
      <span aria-hidden className="border-border/40 h-px flex-1 border-t" />
    </div>
  );
}
