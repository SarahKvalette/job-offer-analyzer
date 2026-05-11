import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Lazily initialised Upstash Redis client.
 *
 * Vercel KV (powered by Upstash) sets `KV_REST_API_URL` and
 * `KV_REST_API_TOKEN` in the project's env once the integration is
 * provisioned. We fall back to the plain Upstash names
 * (UPSTASH_REDIS_REST_URL/TOKEN) so the code works whether the user set
 * up via Vercel or Upstash directly.
 */
let cached: Redis | null = null;

function resolveCreds(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function getKv(): Redis {
  if (cached) return cached;
  const creds = resolveCreds();
  if (!creds) {
    throw new Error(
      "Vercel KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN (or run `vercel env pull` after adding the KV integration)."
    );
  }
  cached = new Redis({ url: creds.url, token: creds.token });
  return cached;
}

/** Returns null instead of throwing when KV isn't configured yet. */
export function getKvSafe(): Redis | null {
  try {
    return getKv();
  } catch {
    return null;
  }
}

export function isKvConfigured(): boolean {
  return resolveCreds() !== null;
}

/**
 * Centralised key naming so we can grep them later. Single-user app, so
 * no namespacing per user — every key lives in the same flat space.
 */
export const KV_KEYS = {
  googleTokens: "google:tokens",
  digestPreferences: "digest:preferences",
  weeklyStats: (yearWeek: string) => `stats:weekly:${yearWeek}`,
  digestLastSent: "digest:lastSentAt",
  cronSecret: "system:cronSecret",
  discoverSearches: "discover:searches",
  discoverOffers: "discover:offers",
  discoverLastRunAt: "discover:lastRunAt",
  discoverSinceDigestCount: "discover:sinceDigestCount",
  franceTravailToken: "ft:token",
} as const;
