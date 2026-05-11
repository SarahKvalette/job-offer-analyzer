import "server-only";
import type { StoredOffer } from "@/lib/schemas/discover";
import { listSavedSearches, persistOffers } from "./discover";
import { annotateMatches } from "./matcher";
import { SOURCE_ADAPTERS, type SourceId } from "./sources";

export type DiscoverRunReport = {
  searches: number;
  fetched: number;
  matched: number;
  fresh: number;
  errors: { source: SourceId; searchId: string; message: string }[];
};

/**
 * One full polling pass: for every saved search, ask each configured
 * adapter for offers, run the local matcher, dedup against KV, and
 * persist what's new.
 *
 * Returns a small report so the cron route can log it.
 */
export async function runDiscoverOnce(): Promise<DiscoverRunReport> {
  const searches = await listSavedSearches();
  const report: DiscoverRunReport = {
    searches: searches.length,
    fetched: 0,
    matched: 0,
    fresh: 0,
    errors: [],
  };
  if (searches.length === 0) return report;

  const byId = new Map<string, StoredOffer>();

  for (const search of searches) {
    for (const sourceId of search.sources) {
      const adapter = SOURCE_ADAPTERS[sourceId];
      if (!adapter.isConfigured()) continue;
      try {
        const offers = await adapter.fetchForSearch(search);
        report.fetched += offers.length;
        for (const offer of offers) {
          const existing = byId.get(offer.id);
          if (existing) {
            // Merge tags / matched ids deterministically.
            existing.tags = Array.from(
              new Set([...existing.tags, ...offer.tags])
            );
          } else {
            byId.set(offer.id, offer);
          }
        }
      } catch (err) {
        report.errors.push({
          source: sourceId,
          searchId: search.id,
          message: err instanceof Error ? err.message : "unknown",
        });
      }
    }
  }

  const annotated = annotateMatches(Array.from(byId.values()), searches);
  report.matched = annotated.length;

  const fresh = await persistOffers(annotated);
  report.fresh = fresh.length;
  return report;
}
