"use client";

import { Slider } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

export function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-foreground text-xs font-medium">{label}</span>
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {value}
        </span>
      </div>
      <Slider.Root
        value={[value]}
        onValueChange={(v) => {
          const n = Array.isArray(v) ? v[0] : v;
          onChange(typeof n === "number" ? n : 50);
        }}
        min={0}
        max={100}
        step={1}
      >
        <Slider.Control className="relative flex h-5 w-full touch-none select-none items-center">
          <Slider.Track className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full">
            <Slider.Indicator className="bg-foreground absolute h-full" />
          </Slider.Track>
          <Slider.Thumb
            className={cn(
              "border-border bg-card focus-visible:ring-ring/40 block size-3.5 rounded-full border-2 outline-none transition-colors",
              "hover:border-foreground/60 focus-visible:ring-2"
            )}
          />
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}
