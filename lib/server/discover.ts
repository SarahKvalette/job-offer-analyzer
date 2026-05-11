import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  savedSearchSchema,
  storedOfferSchema,
  type SavedSearch,
  type SavedSearchPatch,
  type StoredOffer,
} from "@/lib/schemas/discover";
import { getKv, isKvConfigured, KV_KEYS } from "./kv";

/**
 * KV-backed storage for saved searches and the offer feed.
 *
 * - Saved searches: single JSON array under `discover:searches`.
 * - Offers: capped JSON array (200 entries max) under `discover:offers`,
 *   sorted by `fetchedAt` desc. Dedup is done by stable id (sha1 of
 *   the source URL) so re-polling the same offer is a no-op.
 *
 * Why a flat JSON array instead of Redis sorted sets: the cron only
 * runs once a day and the UI reads the whole list at once — one GET /
 * one SET is simpler and stays well under Upstash payload limits.
 */

const MAX_OFFERS = 200;

function safeJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return raw as T;
}

export function makeOfferId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

/* ---------- saved searches ---------- */

export async function listSavedSearches(): Promise<SavedSearch[]> {
  if (!isKvConfigured()) return [];
  const kv = getKv();
  const raw = await kv.get<string | object>(KV_KEYS.discoverSearches);
  const parsed = safeJson<unknown[]>(raw);
  if (!Array.isArray(parsed)) return [];
  const out: SavedSearch[] = [];
  for (const candidate of parsed) {
    const ok = savedSearchSchema.safeParse(candidate);
    if (ok.success) out.push(ok.data);
  }
  return out;
}

async function writeSearches(searches: SavedSearch[]): Promise<void> {
  const kv = getKv();
  await kv.set(KV_KEYS.discoverSearches, JSON.stringify(searches));
}

export async function createSavedSearch(
  patch: SavedSearchPatch
): Promise<SavedSearch> {
  const next: SavedSearch = savedSearchSchema.parse({
    id: randomUUID(),
    createdAt: Date.now(),
    label: patch.label ?? "Untitled search",
    keywords: patch.keywords ?? [],
    excludeKeywords: patch.excludeKeywords ?? [],
    remote: patch.remote ?? "any",
    minSalaryEUR: patch.minSalaryEUR ?? null,
    locations: patch.locations ?? [],
    sources: patch.sources ?? ["remotive", "francetravail"],
  });
  const all = await listSavedSearches();
  all.push(next);
  await writeSearches(all);
  return next;
}

export async function updateSavedSearch(
  id: string,
  patch: SavedSearchPatch
): Promise<SavedSearch | null> {
  const all = await listSavedSearches();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const merged = savedSearchSchema.parse({ ...all[idx], ...patch });
  all[idx] = merged;
  await writeSearches(all);
  return merged;
}

export async function deleteSavedSearch(id: string): Promise<boolean> {
  const all = await listSavedSearches();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  await writeSearches(next);
  return true;
}

/* ---------- offers ---------- */

export async function listOffers(): Promise<StoredOffer[]> {
  if (!isKvConfigured()) return [];
  const kv = getKv();
  const raw = await kv.get<string | object>(KV_KEYS.discoverOffers);
  const parsed = safeJson<unknown[]>(raw);
  if (!Array.isArray(parsed)) return [];
  const out: StoredOffer[] = [];
  for (const candidate of parsed) {
    const ok = storedOfferSchema.safeParse(candidate);
    if (ok.success) out.push(ok.data);
  }
  return out;
}

/**
 * Merge `incoming` offers with the existing list, dedup by id, cap at
 * MAX_OFFERS. Returns the offers that are actually new (used for the
 * digest counter).
 */
export async function persistOffers(
  incoming: StoredOffer[]
): Promise<StoredOffer[]> {
  const existing = await listOffers();
  const seen = new Set(existing.map((o) => o.id));
  const fresh: StoredOffer[] = [];
  for (const offer of incoming) {
    if (seen.has(offer.id)) continue;
    seen.add(offer.id);
    fresh.push(offer);
  }
  if (fresh.length === 0) return [];

  const merged = [...fresh, ...existing]
    .sort((a, b) => b.fetchedAt - a.fetchedAt)
    .slice(0, MAX_OFFERS);

  const kv = getKv();
  await kv.set(KV_KEYS.discoverOffers, JSON.stringify(merged));
  await kv.set(KV_KEYS.discoverLastRunAt, Date.now());

  // Bump the "since last digest" counter so the weekly email can mention it.
  const current = (await kv.get<number>(KV_KEYS.discoverSinceDigestCount)) ?? 0;
  await kv.set(KV_KEYS.discoverSinceDigestCount, current + fresh.length);

  return fresh;
}

export async function getLastRunAt(): Promise<number | null> {
  if (!isKvConfigured()) return null;
  const kv = getKv();
  const raw = await kv.get<number | string>(KV_KEYS.discoverLastRunAt);
  if (raw == null) return null;
  return typeof raw === "string" ? Number(raw) || null : raw;
}

export async function getSinceDigestCount(): Promise<number> {
  if (!isKvConfigured()) return 0;
  const kv = getKv();
  const raw = await kv.get<number | string>(KV_KEYS.discoverSinceDigestCount);
  if (raw == null) return 0;
  return typeof raw === "string" ? Number(raw) || 0 : raw;
}

export async function resetSinceDigestCount(): Promise<void> {
  if (!isKvConfigured()) return;
  const kv = getKv();
  await kv.set(KV_KEYS.discoverSinceDigestCount, 0);
}
