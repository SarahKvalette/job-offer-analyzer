import type { FitBreakdown, FitDimension } from "@/lib/analysis/fit-score";

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 80;

const ORDER: FitDimension[] = [
  "salary",
  "stack",
  "growth",
  "culture",
  "balance",
  "remote",
];

/**
 * Convert a (dimensionIndex, score) pair into Cartesian coordinates.
 *
 * Axes are evenly spaced around the circle starting at 12 o'clock and
 * progressing clockwise — the same order as in `ORDER`.
 */
function pointFor(index: number, score: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / ORDER.length - Math.PI / 2;
  const r = RADIUS * Math.max(0, Math.min(1, score));
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

function axisEndpoint(index: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / ORDER.length - Math.PI / 2;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

type SvgAnchor = "start" | "middle" | "end";

function labelPosition(
  index: number
): { x: number; y: number; anchor: SvgAnchor } {
  const angle = (Math.PI * 2 * index) / ORDER.length - Math.PI / 2;
  const r = RADIUS + 18;
  const x = CENTER + r * Math.cos(angle);
  const y = CENTER + r * Math.sin(angle);
  // Anchor based on horizontal position
  let anchor: SvgAnchor;
  if (Math.abs(Math.cos(angle)) < 0.3) anchor = "middle";
  else if (Math.cos(angle) > 0) anchor = "start";
  else anchor = "end";
  return { x, y, anchor };
}

const LABELS: Record<FitDimension, string> = {
  salary: "Salary",
  stack: "Stack",
  growth: "Growth",
  culture: "Culture",
  balance: "Balance",
  remote: "Remote",
};

export function FitRadar({ breakdown }: { breakdown: FitBreakdown }) {
  const points = ORDER.map((dim, i) => pointFor(i, breakdown[dim]));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="text-foreground/80 size-full"
      role="img"
      aria-label="Fit score breakdown across six dimensions"
    >
      {/* Concentric reference rings at 25 / 50 / 75 / 100% */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <circle
          key={r}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS * r}
          fill="none"
          className="stroke-muted-foreground/20"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {ORDER.map((_, i) => {
        const end = axisEndpoint(i);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            className="stroke-muted-foreground/20"
            strokeWidth={1}
          />
        );
      })}

      {/* Filled polygon */}
      <path
        d={path}
        className="fill-[color:var(--accent-violet)]/25 stroke-[color:var(--accent-violet)]"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Vertex dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          className="fill-[color:var(--accent-violet)]"
        />
      ))}

      {/* Axis labels */}
      {ORDER.map((dim, i) => {
        const { x, y, anchor } = labelPosition(i);
        return (
          <text
            key={dim}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-foreground/70 font-mono text-[9px] uppercase tracking-wider"
          >
            {LABELS[dim]}
          </text>
        );
      })}
    </svg>
  );
}
