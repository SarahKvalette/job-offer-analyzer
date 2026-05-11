import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildOwnerCookieValue,
  isEmailAllowed,
  ownerCookieOptions,
} from "@/lib/server/owner-auth";
import { exchangeCodeAndStore } from "@/lib/server/google-oauth";
import { OAUTH_STATE_COOKIE } from "@/lib/server/google-oauth-state";

export const runtime = "nodejs";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

function failTo(target: "/login" | "/", reason: string) {
  const url = new URL(target, appBaseUrl());
  url.searchParams.set("google_error", reason);
  return NextResponse.redirect(url);
}

function succeed(target: string) {
  const safe = target.startsWith("/") ? target : "/";
  const url = new URL(safe, appBaseUrl());
  return NextResponse.redirect(url);
}

/**
 * Google OAuth callback — does double duty as sign-in and Gmail/Calendar
 * grant. No owner cookie is required when this fires; we mint it here
 * after verifying the returned email is in the JOA_OWNER_EMAIL allowlist.
 *
 * State cookie format: `<nonce>|<urlencoded-next>`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");
  if (errParam) return failTo("/login", errParam);
  if (!code || !state) return failTo("/login", "missing_params");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) {
    return failTo("/login", "state_mismatch");
  }

  // Recover the `next` path the user wanted to land on before sign-in.
  const pipeIdx = state.indexOf("|");
  const nextPath =
    pipeIdx === -1
      ? "/"
      : decodeURIComponent(state.slice(pipeIdx + 1) || "/");

  try {
    const stored = await exchangeCodeAndStore(code);
    if (!isEmailAllowed(stored.email)) {
      // Reject — the Google sign-in succeeded, but it's not the owner.
      // Tokens were stored, but they're tied to a non-allowlisted email,
      // so we never expose them through the protected routes.
      return failTo("/login", "not_authorized");
    }

    const opts = ownerCookieOptions();
    cookieStore.set({
      name: opts.name,
      value: buildOwnerCookieValue(),
      httpOnly: opts.httpOnly,
      sameSite: opts.sameSite,
      secure: opts.secure,
      path: opts.path,
      maxAge: opts.maxAge,
    });

    return succeed(nextPath);
  } catch (err) {
    console.error("google callback error", err);
    return failTo("/login", "exchange_failed");
  }
}
