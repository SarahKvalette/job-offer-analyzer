import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-owner auth gate.
 *
 * The user sets `JOA_OWNER_SECRET` once in env. The /login route checks
 * the submitted password against that secret and, on success, sets a
 * httpOnly cookie containing an HMAC-signed token. Any protected route
 * verifies the cookie via `assertOwner()` (or the lighter
 * `isOwnerSession()`).
 *
 * Why HMAC over storing the secret in the cookie:
 *   - We can rotate the secret without invalidating old cookies… or
 *     decide we want to (just bump the secret to invalidate everyone).
 *   - The cookie value alone reveals nothing useful — even if leaked
 *     out of a browser, an attacker still needs JOA_OWNER_SECRET to
 *     forge a new token.
 */

const COOKIE_NAME = "joa_owner";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.JOA_OWNER_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error(
      "JOA_OWNER_SECRET is not set or too short (min 8 chars). Add it to .env.local and to the Vercel project."
    );
  }
  return secret;
}

function signToken(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function buildToken(): string {
  // Token payload: literal "owner" — single-user app, no per-user data.
  // Could embed an `iat` timestamp later if we want forced rotation.
  const payload = "owner";
  return `${payload}.${signToken(payload)}`;
}

function verifyToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (payload !== "owner") return false;
  let expected: string;
  try {
    expected = signToken(payload);
  } catch {
    return false;
  }
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export const OWNER_COOKIE_NAME = COOKIE_NAME;

/**
 * Compare a submitted password to JOA_OWNER_SECRET in constant time.
 *
 * Both sides are trimmed before comparison — a trailing space in
 * `JOA_OWNER_SECRET` (common when pasting via `vercel env add`) used
 * to silently reject the otherwise-correct password.
 */
export function verifyPassword(submitted: string): boolean {
  if (typeof submitted !== "string" || submitted.length === 0) return false;
  let secret: string;
  try {
    secret = getSecret().trim();
  } catch {
    return false;
  }
  const candidate = submitted.trim();
  if (candidate.length === 0) return false;
  if (candidate.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(secret));
}

export function buildOwnerCookieValue(): string {
  return buildToken();
}

export function ownerCookieOptions(): {
  name: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/**
 * Returns true when the request carries a valid owner cookie.
 * Use this in `route.ts` handlers via `await isOwnerSession()`.
 */
export async function isOwnerSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return verifyToken(value);
}

/**
 * Throw 401-shaped error if the caller isn't the owner.
 * Returns the HTTP-style payload to be passed to NextResponse.json().
 */
export type OwnerCheck =
  | { ok: true }
  | {
      ok: false;
      status: 401;
      body: { error: { code: "unauthenticated"; message: string } };
    };

export async function ownerCheck(): Promise<OwnerCheck> {
  const ok = await isOwnerSession();
  if (ok) return { ok: true };
  return {
    ok: false,
    status: 401,
    body: {
      error: {
        code: "unauthenticated",
        message: "Sign in as the owner first.",
      },
    },
  };
}
