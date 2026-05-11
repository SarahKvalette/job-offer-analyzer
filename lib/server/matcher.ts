import "server-only";
import type { SavedSearch, StoredOffer } from "@/lib/schemas/discover";

/**
 * Local matcher: decides whether an `offer` fits a `search`.
 *
 * The source adapters already pre-filter via the API (when supported),
 * so this is the second-pass refinement — checks remote preference,
 * salary floor, exclude-keywords, and re-confirms the keyword match
 * across title + description + tags.
 */

// Strip diacritics so "Lyon" matches "lyon" but also "café" matches "cafe".
const COMBINING_MARKS = /[̀-ͯ]/g;
function normalise(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");
}

function haystack(offer: StoredOffer): string {
  return normalise(
    [offer.title, offer.company, offer.description, ...offer.tags].join(" ")
  );
}

function anyKeywordMatches(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  return keywords.some((kw) => {
    const needle = normalise(kw).trim();
    if (!needle) return false;
    return text.includes(needle);
  });
}

function allKeywordsAbsent(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  return keywords.every((kw) => {
    const needle = normalise(kw).trim();
    if (!needle) return true;
    return !text.includes(needle);
  });
}

export function offerMatchesSearch(
  offer: StoredOffer,
  search: SavedSearch
): boolean {
  // Remote preference
  if (search.remote === "only" && !offer.remote) return false;
  if (search.remote === "no" && offer.remote) return false;

  // Salary floor — only filter when we managed to parse a min on the offer.
  // Unparsed salaries pass through (we'd rather over-include than hide).
  if (
    search.minSalaryEUR &&
    offer.salaryMaxEUR != null &&
    offer.salaryMaxEUR < search.minSalaryEUR
  ) {
    return false;
  }

  const text = haystack(offer);

  if (!anyKeywordMatches(text, search.keywords)) return false;
  if (!allKeywordsAbsent(text, search.excludeKeywords)) return false;

  // Locations: only enforced when the offer is not remote (remote roles
  // are location-agnostic). Otherwise the offer's location must contain
  // any of the requested location strings.
  if (!offer.remote && search.locations.length > 0) {
    const locText = normalise(offer.location);
    const hit = search.locations.some((loc) =>
      locText.includes(normalise(loc))
    );
    if (!hit) return false;
  }

  return true;
}

/**
 * Annotate offers with which saved searches matched them. Offers that
 * match nothing are dropped.
 */
export function annotateMatches(
  offers: StoredOffer[],
  searches: SavedSearch[]
): StoredOffer[] {
  const out: StoredOffer[] = [];
  for (const offer of offers) {
    const matchedSearchIds = searches
      .filter((s) => offerMatchesSearch(offer, s))
      .map((s) => s.id);
    if (matchedSearchIds.length === 0) continue;
    out.push({ ...offer, matchedSearchIds });
  }
  return out;
}
