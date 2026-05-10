import { NextResponse } from "next/server";
import { z } from "zod";
import { ownerCheck } from "@/lib/server/owner-auth";
import { createCalendarEvent } from "@/lib/server/calendar";

export const runtime = "nodejs";

const bodySchema = z.object({
  summary: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  startISO: z.string().min(1),
  endISO: z.string().optional(),
  timeZone: z.string().optional(),
});

export async function POST(request: Request) {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid event payload." } },
      { status: 400 }
    );
  }

  try {
    const event = await createCalendarEvent(parsed.data);
    return NextResponse.json(event);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Calendar event creation failed.";
    const status = /not connected/i.test(message) ? 409 : 502;
    return NextResponse.json(
      { error: { code: "calendar_failed", message } },
      { status }
    );
  }
}
