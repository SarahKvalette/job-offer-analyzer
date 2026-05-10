import { NextResponse } from "next/server";
import { ownerCheck } from "@/lib/server/owner-auth";
import { scanRecruiterLeads } from "@/lib/server/gmail";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "14");
  const maxResults = Number(url.searchParams.get("max") ?? "25");

  try {
    const leads = await scanRecruiterLeads({ days, maxResults });
    return NextResponse.json({ leads });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gmail scan failed.";
    const status = /not connected/i.test(message) ? 409 : 502;
    return NextResponse.json(
      { error: { code: "gmail_failed", message } },
      { status }
    );
  }
}
