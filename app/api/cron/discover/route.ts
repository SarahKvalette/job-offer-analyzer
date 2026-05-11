import { NextResponse } from "next/server";
import { isKvConfigured } from "@/lib/server/kv";
import { runDiscoverOnce } from "@/lib/server/discover-run";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron entry point — daily poll of every source for every
 * saved search. Same auth pattern as `/api/cron/digest`.
 *
 * Manual invocation (for owner sanity-checks): hit the route with
 * `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set the
 * route is callable by anyone, which is fine in dev.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
  }

  if (!isKvConfigured()) {
    return NextResponse.json({ ok: false, skipped: "kv_unconfigured" });
  }

  try {
    const report = await runDiscoverOnce();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "run_failed",
      },
      { status: 502 }
    );
  }
}
