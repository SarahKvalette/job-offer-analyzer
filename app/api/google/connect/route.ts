import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { ownerCheck } from "@/lib/server/owner-auth";
import {
  buildAuthUrl,
  isGoogleOAuthConfigured,
} from "@/lib/server/google-oauth";

export const runtime = "nodejs";

import { OAUTH_STATE_COOKIE } from "@/lib/server/google-oauth-state";

export async function GET() {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
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

  const state = randomBytes(24).toString("hex");
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
