import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import {
  buildAuthUrl,
  isGoogleOAuthConfigured,
} from "@/lib/server/google-oauth";
import { OAUTH_STATE_COOKIE } from "@/lib/server/google-oauth-state";

export const runtime = "nodejs";

/**
 * Sign-in entry point. Public route — no owner gate, because *this* is
 * how the owner becomes the owner. The callback (/api/google/callback)
 * is responsible for rejecting any non-allowlisted email.
 *
 * Supports an optional `?next=<path>` query parameter so the callback
 * knows where to send the user after auth (e.g. `/discover`).
 */
export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "google_not_configured",
          message:
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env first.",
        },
      },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";

  // The state cookie has two roles: anti-CSRF (compared in the callback)
  // and post-auth redirect (we stash the `next` path alongside the random
  // nonce, separated by a "|").
  const nonce = randomBytes(24).toString("hex");
  const state = `${nonce}|${encodeURIComponent(next)}`;

  const cookieStore = await cookies();
  cookieStore.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const authUrl = buildAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
