import "server-only";
import type { SavedSearch, StoredOffer } from "@/lib/schemas/discover";

export type SourceId = "remotive" | "francetravail";

export interface SourceAdapter {
  id: SourceId;
  /** Returns `false` if the source is not configured (e.g. missing creds). */
  isConfigured: () => boolean;
  /**
   * Fetch fresh offers for a saved search. Adapters should respect
   * `search.keywords` / `search.locations` server-side when the source
   * supports it; matching/dedup is handled by the orchestrator.
   */
  fetchForSearch: (search: SavedSearch) => Promise<StoredOffer[]>;
}

/** Strip basic HTML so a job description is safe to render as text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max = 400): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
