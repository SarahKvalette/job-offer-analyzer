import benchmarksData from "@/lib/data/salary-benchmarks-fr.json";

export type BenchRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "data"
  | "devops"
  | "mobile";
export type BenchLevel = "junior" | "mid" | "senior" | "staff";
export type BenchLocation = "paris" | "lyon" | "remote-eu";

export interface BenchmarkEntry {
  role: BenchRole;
  level: BenchLevel;
  location: BenchLocation;
  min: number;
  median: number;
  max: number;
}

interface BenchmarksFile {
  currency: "EUR";
  period: "year";
  entries: BenchmarkEntry[];
}

const data = benchmarksData as BenchmarksFile;

/**
 * Direction of a salary vs market median.
 *   - below   : declared median ≤ market median × 0.85
 *   - parity  : within ±15% of market median
 *   - above   : declared median ≥ market median × 1.15
 */
export type SalaryPosition = "below" | "parity" | "above";

export interface SalaryComparison {
  benchmark: BenchmarkEntry;
  declaredMedian: number;
  position: SalaryPosition;
  /**
   * Signed percentage delta vs market median, rounded to nearest int.
   * Positive = above market.
   */
  deltaPercent: number;
}

/**
 * Look up a benchmark entry. Returns `null` when the role / level / location
 * combination is not in the curated dataset.
 *
 * The lookup is forgiving: location is normalised (lowercased, trimmed),
 * common location aliases are mapped to canonical keys.
 */
export function findBenchmark(
  role: BenchRole,
  level: BenchLevel,
  location: BenchLocation
): BenchmarkEntry | null {
  return (
    data.entries.find(
      (e) =>
        e.role === role && e.level === level && e.location === location
    ) ?? null
  );
}

const LOCATION_ALIASES: Record<string, BenchLocation> = {
  paris: "paris",
  "île-de-france": "paris",
  "ile-de-france": "paris",
  idf: "paris",
  lyon: "lyon",
  "remote": "remote-eu",
  "remote-eu": "remote-eu",
  "fully remote": "remote-eu",
  "full remote": "remote-eu",
  "télétravail": "remote-eu",
  "teletravail": "remote-eu",
};

/**
 * Best-effort normalisation of a free-form location string. Returns `null`
 * when no alias matches — caller can decide to fall back to "remote-eu" or
 * to skip benchmarking entirely.
 */
export function normaliseLocation(raw: string | null): BenchLocation | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (cleaned.includes(alias)) return canonical;
  }
  return null;
}

/**
 * Map the analysis' announced seniority enum to the benchmark level.
 * `unknown` returns null — caller decides whether to skip or default.
 */
export function normaliseLevel(
  announced: "junior" | "mid" | "senior" | "staff" | "unknown"
): BenchLevel | null {
  if (announced === "unknown") return null;
  return announced;
}

/**
 * Compare a declared salary range to the closest benchmark.
 *
 * Inputs are integers in the same currency unit (EUR). We compute a
 * declared median = (min + max) / 2 and express the delta vs market
 * median. Currency mismatch returns null — we don't do FX conversions.
 */
export function compareSalary(
  declared: { min: number; max: number; currency: string; period: string },
  benchmark: BenchmarkEntry
): SalaryComparison | null {
  if (declared.currency !== "EUR") return null;
  if (declared.period !== "year") return null;

  const declaredMedian = Math.round((declared.min + declared.max) / 2);
  const ratio = declaredMedian / benchmark.median;
  const deltaPercent = Math.round((ratio - 1) * 100);

  let position: SalaryPosition;
  if (ratio <= 0.85) position = "below";
  else if (ratio >= 1.15) position = "above";
  else position = "parity";

  return {
    benchmark,
    declaredMedian,
    position,
    deltaPercent,
  };
}
