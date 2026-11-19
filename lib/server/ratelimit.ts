import "server-only";
import { getKvSafe } from "./kv";

/**
 * Cost guardrails for the public `/api/analyze` endpoint.
 *
 * Two fixed-window counters, both backed by Upstash Redis (the same KV the
 * discover/digest features already use):
 *   - per-IP:  caps how many analyses a single visitor can trigger per hour,
 *     so one person can't drain the free Groq tier.
 *   - global:  a daily ceiling across *all* visitors, the hard stop on the
 *     monthly bill when the tool is shared publicly.
 *
 * Design choices:
 *   - **Fail open.** If KV isn't configured (local dev) or a Redis call
 *     throws, we allow the request. Availability beats strict enforcement for
 *     a portfolio tool; the MAX_INPUT_CHARS cap still bounds per-call cost.
 *   - **No posting content is read or stored.** Keys hold integer counters
 *     only — never the annonce text, never a company name. The IP is hashed
 *     into the key space by Redis as an opaque string; we don't log it.
 */

const IP_LIMIT = numberFromEnv("ANALYZE_IP_HOURLY_LIMIT", 8);
const IP_WINDOW_SECONDS = 60 * 60; // 1 hour

const GLOBAL_LIMIT = numberFromEnv("ANALYZE_GLOBAL_DAILY_LIMIT", 300);
const GLOBAL_WINDOW_SECONDS = 60 * 60 * 24; // 1 day

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; scope: "ip" | "global"; retryAfterSeconds: number };

/**
 * Best-effort client IP from proxy headers. On Vercel `x-forwarded-for`
 * holds the real client IP as the first entry. We never log this value.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function windowBucket(windowSeconds: number): number {
  return Math.floor(Date.now() / 1000 / windowSeconds);
}

/**
 * Increment a fixed-window counter and return the current count. Sets the
 * key's expiry on the first hit of the window so it self-cleans.
 */
async function bumpWindow(
  redis: ReturnType<typeof getKvSafe>,
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttl: number }> {
  // redis is non-null here (caller checked), but keep TS happy.
  if (!redis) return { count: 0, ttl: windowSeconds };
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
    return { count, ttl: windowSeconds };
  }
  const ttl = await redis.ttl(key);
  return { count, ttl: ttl > 0 ? ttl : windowSeconds };
}

/**
 * Enforce the per-IP and global caps for an analyze request. Fails open on
 * any infrastructure problem.
 */
export async function checkAnalyzeRateLimit(
  headers: Headers
): Promise<RateLimitResult> {
  const redis = getKvSafe();
  if (!redis) return { ok: true }; // KV not provisioned → no limiting.

  try {
    const ip = clientIpFrom(headers);
    const ipKey = `rl:analyze:ip:${ip}:${windowBucket(IP_WINDOW_SECONDS)}`;
    const ipHit = await bumpWindow(redis, ipKey, IP_WINDOW_SECONDS);
    if (ipHit.count > IP_LIMIT) {
      return { ok: false, scope: "ip", retryAfterSeconds: ipHit.ttl };
    }

    const globalKey = `rl:analyze:global:${windowBucket(GLOBAL_WINDOW_SECONDS)}`;
    const globalHit = await bumpWindow(redis, globalKey, GLOBAL_WINDOW_SECONDS);
    if (globalHit.count > GLOBAL_LIMIT) {
      return { ok: false, scope: "global", retryAfterSeconds: globalHit.ttl };
    }

    return { ok: true };
  } catch {
    // Redis hiccup — don't break analysis for everyone.
    return { ok: true };
  }
}

/**
 * Friendly, non-technical French messages shown to the visitor when a cap is
 * hit. They tell the person what to do next (wait, or try the free examples)
 * rather than surfacing an HTTP error.
 */
export const RATE_LIMIT_MESSAGES: Record<"ip" | "global", string> = {
  ip: "Vous avez atteint la limite d'analyses pour le moment. Réessayez dans un petit moment, ou explorez les annonces d'exemple — elles sont gratuites et instantanées.",
  global:
    "L'outil a atteint son plafond d'analyses pour aujourd'hui. Réessayez demain, ou parcourez les annonces d'exemple en attendant — elles restent accessibles.",
};
