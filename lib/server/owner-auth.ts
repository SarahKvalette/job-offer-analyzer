import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-owner auth gate, backed by Google sign-in.
 *
 * The user clicks "Sign in with Google" on /login. The OAuth callback
 * checks the returned email against `JOA_OWNER_EMAIL` (comma-separated
 * allowlist) and, on success, sets a httpOnly cookie containing an
 * HMAC-signed token. Any protected route verifies the cookie via
 * `isOwnerSession()` / `ownerCheck()`.
 *
 * `JOA_OWNER_SECRET` is now used only as the HMAC signing key for the
 * cookie — never typed by the user anywhere. Rotate it to invalidate
 * all existing sessions.
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
 * Allowed Google account emails — comma-separated in `JOA_OWNER_EMAIL`.
 * Comparison is case-insensitive and ignores surrounding whitespace, so
 * "Sarah@Gmail.COM " in env still matches "sarah@gmail.com" from Google.
 */
export function getAllowedEmails(): string[] {
  const raw = process.env.JOA_OWNER_EMAIL;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
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
