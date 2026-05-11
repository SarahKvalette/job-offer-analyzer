import "server-only";
import type { SavedSearch, StoredOffer } from "@/lib/schemas/discover";
import { makeOfferId } from "@/lib/server/discover";
import { stripHtml, truncate, type SourceAdapter } from "./types";

/**
 * Remotive (remotive.com) public JSON API. No auth, no quota enforced
 * for our usage volume. Returns up to ~50 jobs per call.
 *
 * Docs: https://remotive.com/api/remote-jobs (read-only).
 */

const ENDPOINT = "https://remotive.com/api/remote-jobs";

type RawJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location?: string;
  job_type?: string;
  publication_date: string;
  salary?: string;
  tags?: string[];
  description?: string;
};

type RawResponse = {
  jobs?: RawJob[];
};

/**
 * Best-effort EUR conversion from a salary string like "$50,000 - $80,000".
 * Returns null when we can't parse two numbers. USD is taken at ~0.92 EUR,
 * GBP at ~1.17 EUR — close enough for a coarse filter.
 */
function parseSalaryToEUR(text: string | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!text) return { min: null, max: null };
  const lower = text.toLowerCase();
  const rate = lower.includes("£") || lower.includes("gbp")
    ? 1.17
    : lower.includes("€") || lower.includes("eur")
      ? 1
      : lower.includes("$") || lower.includes("usd") || lower.includes("cad")
        ? 0.92
        : 1;
  // Match numbers with optional 'k' suffix.
  const matches = [...text.matchAll(/(\d{2,3}(?:[.,]\d{3})*|\d{1,3})\s*(k|K)?/g)];
  const nums = matches
    .map((m) => {
      const base = Number(m[1].replace(/[.,]/g, ""));
      if (!isFinite(base)) return null;
      return m[2] ? base * 1000 : base;
    })
    .filter((n): n is number => n !== null && n >= 10_000 && n <= 500_000);
  if (nums.length === 0) return { min: null, max: null };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return {
    min: Math.round(min * rate),
    max: Math.round(max * rate),
  };
}

function buildUrl(search: SavedSearch): string {
  const params = new URLSearchParams();
  const term = search.keywords[0]; // Remotive accepts a single search term.
  if (term) params.set("search", term);
  params.set("limit", "50");
  return `${ENDPOINT}?${params.toString()}`;
}

export const remotiveAdapter: SourceAdapter = {
  id: "remotive",
  isConfigured: () => true,
  async fetchForSearch(search) {
    const url = buildUrl(search);
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Remotive responded ${res.status}`);
    }
    const data = (await res.json()) as RawResponse;
    const jobs = data.jobs ?? [];
    const now = Date.now();
    const offers: StoredOffer[] = jobs.map((job) => {
      const description = stripHtml(job.description ?? "");
      const salary = parseSalaryToEUR(job.salary);
      const publishedAt = (() => {
        const t = Date.parse(job.publication_date);
        return isFinite(t) ? t : now;
      })();
      return {
        id: makeOfferId(job.url),
        source: "remotive",
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || "Remote",
        remote: true, // Remotive is remote-only by definition.
        salaryText: job.salary?.trim() || null,
        salaryMinEUR: salary.min,
        salaryMaxEUR: salary.max,
        url: job.url,
        description: truncate(description),
        tags: job.tags ?? [],
        publishedAt,
        fetchedAt: now,
        matchedSearchIds: [],
      };
    });
    return offers;
  },
};
