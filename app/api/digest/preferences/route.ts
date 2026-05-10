import { NextResponse } from "next/server";
import { z } from "zod";
import { ownerCheck } from "@/lib/server/owner-auth";
import {
  getDigestPreferences,
  isResendConfigured,
  saveDigestPreferences,
} from "@/lib/server/digest";
import { isKvConfigured } from "@/lib/server/kv";

export const runtime = "nodejs";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  email: z.string().email().or(z.literal("")).optional(),
});

export async function GET() {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
  if (!isKvConfigured()) {
    return NextResponse.json({
      enabled: false,
      email: "",
      kvConfigured: false,
      resendConfigured: isResendConfigured(),
    });
  }
  const prefs = await getDigestPreferences();
  return NextResponse.json({
    ...prefs,
    kvConfigured: true,
    resendConfigured: isResendConfigured(),
  });
}

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid patch." } },
      { status: 400 }
    );
  }

  const prefs = await saveDigestPreferences(parsed.data);
  return NextResponse.json(prefs);
}
