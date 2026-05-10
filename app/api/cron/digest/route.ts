import { NextResponse } from "next/server";
import {
  getDigestPreferences,
  isResendConfigured,
  sendDigest,
} from "@/lib/server/digest";
import { isKvConfigured } from "@/lib/server/kv";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Vercel Cron triggers this endpoint. Vercel auto-attaches an
 * `Authorization: Bearer <CRON_SECRET>` header, which we verify here.
 *
 * Schedule: Monday 09:00 Paris (07:00 UTC) — see vercel.json.
 *
 * The cron is a no-op when:
 *  - KV / Resend isn't configured
 *  - the owner hasn't opted in
 *  - no recipient email is set
 *  - last send was less than 6 days ago (safety net against
 *    duplicate cron firings)
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isKvConfigured() || !isResendConfigured()) {
    return NextResponse.json({ ok: false, skipped: "not_configured" });
  }

  const prefs = await getDigestPreferences();
  if (!prefs.enabled || !prefs.email) {
    return NextResponse.json({ ok: false, skipped: "not_opted_in" });
  }

  const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;
  if (prefs.lastSentAt && Date.now() - prefs.lastSentAt < SIX_DAYS) {
    return NextResponse.json({ ok: false, skipped: "too_recent" });
  }

  try {
    const result = await sendDigest();
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "send_failed",
      },
      { status: 502 }
    );
  }
}
