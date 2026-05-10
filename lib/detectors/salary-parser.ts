/**
 * Salary range parser.
 *
 * Tries hard to extract a numeric `{ min, max }` from free-form text in
 * EUR / USD / GBP, with units expressed as K / k / 000 / "mille",
 * separators as space / non-breaking space / comma / dot, dashes as
 * hyphen / en-dash / "à" / "to", and periods as year / month / day.
 *
 * Returns `null` when no reliable range is found. We never invent a
 * single-bound range.
 */

export type SalaryPeriod = "year" | "month" | "day";

export interface ParsedSalary {
  min: number;
  max: number;
  currency: "EUR" | "USD" | "GBP";
  period: SalaryPeriod;
  /** The matched substring, useful for source highlighting and debug. */
  rawMatch: string;
}

const CURRENCY_PATTERNS: Array<{
  match: RegExp;
  currency: ParsedSalary["currency"];
}> = [
  { match: /€|EUR\b|euros?\b/i, currency: "EUR" },
  { match: /\$|USD\b|dollars?\b/i, currency: "USD" },
  { match: /£|GBP\b|pounds?\b/i, currency: "GBP" },
];

const PERIOD_PATTERNS: Array<{ match: RegExp; period: SalaryPeriod }> = [
  { match: /\bpar\s+an\b|\/\s*an\b|\bpar\s+ann[ée]e\b|\bper\s+year\b|\b\/year\b|\bannuel/i, period: "year" },
  { match: /\bpar\s+mois\b|\/\s*mois\b|\bper\s+month\b|\b\/month\b|\bmensuel/i, period: "month" },
  { match: /\bpar\s+jour\b|\/\s*jour\b|\bper\s+day\b|\b\/day\b|\btjm\b/i, period: "day" },
];

/**
 * Match a numeric literal with optional thousands separator and an optional
 * "K"/"k"/"000" multiplier. Examples covered:
 *   45     45K     45 K     45k    45 000    45,000    45.000   "45 mille"
 */
const NUMBER_TOKEN = String.raw`(\d{1,3}(?:[.,\s ]\d{3})*|\d+)\s*(K|k|mille|000)?`;

/**
 * Whitespace-or-currency-symbol filler that may appear between a number and
 * the separator word — handles forms like "45 000€ à 55 000€" or
 * "£45,000 - £60,000".
 */
const FILLER = String.raw`[\s€$£]*`;
const FILLER1 = String.raw`[\s€$£]+`;

/**
 * Two numbers separated by a dash variant or "à"/"to" / "et".
 */
const RANGE_PATTERNS: RegExp[] = [
  // 45-55K€, 45–55K, 45 - 55 K, £45,000 - £60,000
  new RegExp(
    String.raw`${NUMBER_TOKEN}${FILLER}[–\-—−]${FILLER}${NUMBER_TOKEN}`,
    "g"
  ),
  // 45 000 à 55 000, 45K à 55K, 45 000€ à 55 000€
  new RegExp(String.raw`${NUMBER_TOKEN}${FILLER1}(?:à|a)${FILLER1}${NUMBER_TOKEN}`, "gi"),
  // €55,000 to €70,000, $90k to $120k
  new RegExp(String.raw`${NUMBER_TOKEN}${FILLER1}to${FILLER1}${NUMBER_TOKEN}`, "gi"),
  // entre 45 et 55K
  new RegExp(String.raw`entre${FILLER1}${NUMBER_TOKEN}${FILLER1}et${FILLER1}${NUMBER_TOKEN}`, "gi"),
];

/** Normalise a captured numeric literal + unit to a plain integer. */
function parseNumberToken(numberStr: string, unit?: string): number | null {
  const cleaned = numberStr.replace(/[\s ]/g, "").replace(",", ".");
  // If the token has a single "." with exactly 3 digits after, it's a
  // thousands separator (e.g. "45.000"), not a decimal.
  let n: number;
  if (/^\d+\.\d{3}$/.test(cleaned)) {
    n = parseInt(cleaned.replace(".", ""), 10);
  } else {
    n = parseFloat(cleaned);
  }
  if (!Number.isFinite(n)) return null;

  if (unit) {
    const u = unit.toLowerCase();
    if (u === "k" || u === "mille") n *= 1000;
    else if (u === "000") n *= 1000;
  }
  return Math.round(n);
}

function detectCurrency(text: string): ParsedSalary["currency"] | null {
  for (const { match, currency } of CURRENCY_PATTERNS) {
    if (match.test(text)) return currency;
  }
  return null;
}

function detectPeriod(text: string): SalaryPeriod {
  for (const { match, period } of PERIOD_PATTERNS) {
    if (match.test(text)) return period;
  }
  // Default: yearly is the most common in tech postings.
  return "year";
}

/**
 * Sanity bounds — anything outside this range is almost certainly noise
 * (years, contract IDs, etc.).
 *
 *   yearly:  20k → 1M
 *   monthly: 1.5k → 100k
 *   daily:   100 → 5k
 */
function isPlausible(min: number, max: number, period: SalaryPeriod): boolean {
  if (min <= 0 || max <= 0 || max < min) return false;
  if (max / min > 4) return false; // wild ranges = false positives
  if (period === "year") return min >= 15_000 && max <= 1_500_000;
  if (period === "month") return min >= 800 && max <= 200_000;
  return min >= 80 && max <= 8_000;
}

/**
 * Extract a salary range from free text. Returns the first plausible match
 * encountered, scanned in pattern order (most specific first).
 */
export function parseSalaryRange(text: string): ParsedSalary | null {
  if (!text || text.length === 0) return null;

  for (const re of RANGE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const [rawMatch, num1, unit1, num2, unit2] = m;
      const a = parseNumberToken(num1, unit1);
      const b = parseNumberToken(num2, unit2);
      if (a === null || b === null) continue;

      // Inherit unit if only one side had one
      let min = Math.min(a, b);
      let max = Math.max(a, b);
      if (unit1 && !unit2 && b < a) {
        // pattern like "45-55K": both should be K
        const bScaled = parseNumberToken(num2, unit1);
        if (bScaled !== null) {
          min = Math.min(a, bScaled);
          max = Math.max(a, bScaled);
        }
      } else if (!unit1 && unit2 && a < b) {
        const aScaled = parseNumberToken(num1, unit2);
        if (aScaled !== null) {
          min = Math.min(aScaled, b);
          max = Math.max(aScaled, b);
        }
      }

      // Look at a small window around the match for currency + period clues
      const windowStart = Math.max(0, m.index - 30);
      const windowEnd = Math.min(text.length, m.index + rawMatch.length + 30);
      const ctx = text.slice(windowStart, windowEnd);

      const currency = detectCurrency(ctx);
      if (!currency) continue;

      const period = detectPeriod(ctx);
      if (!isPlausible(min, max, period)) continue;

      return { min, max, currency, period, rawMatch };
    }
  }

  return null;
}
