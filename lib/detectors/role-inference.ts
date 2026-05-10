import type { BenchRole } from "./salary-benchmark";

/**
 * Heuristic role inference from a job title.
 *
 * Order matters — checked top-to-bottom, first hit wins. "Fullstack" is
 * checked before frontend / backend so a "Senior Fullstack Engineer"
 * doesn't get classified as backend just because "back" appears later.
 */
const RULES: Array<{ test: RegExp; role: BenchRole }> = [
  { test: /\bfull[\s-]?stack\b/i, role: "fullstack" },
  { test: /\bdev[\s-]?ops\b|\bsre\b|\bsite reliability\b|\bplatform engineer/i, role: "devops" },
  { test: /\bdata (?:engineer|scientist|analyst)\b|\banalytics? engineer\b|\bml engineer\b|\bmachine learning\b/i, role: "data" },
  { test: /\b(?:ios|android|mobile|react native|flutter|swift|kotlin)\b/i, role: "mobile" },
  { test: /\bfront[\s-]?end\b|\breact\b(?:\s+developer)?|\bvue\b|\bangular\b/i, role: "frontend" },
  { test: /\bback[\s-]?end\b|\bapi engineer\b|\bserver(?:\s+side)?\b/i, role: "backend" },
];

/**
 * Returns a canonical benchmark role for a job title, or null if none of
 * the heuristics fire (caller should skip benchmarking in that case).
 */
export function inferBenchmarkRole(title: string): BenchRole | null {
  if (!title) return null;
  for (const rule of RULES) {
    if (rule.test.test(title)) return rule.role;
  }
  return null;
}
