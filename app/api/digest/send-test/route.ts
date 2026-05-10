import { NextResponse } from "next/server";
import { ownerCheck } from "@/lib/server/owner-auth";
import {
  isResendConfigured,
  getDigestPreferences,
  sendDigest,
} from "@/lib/server/digest";
import { isKvConfigured } from "@/lib/server/kv";

export const runtime = "nodejs";

export async function POST() {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
  if (!isResendConfigured() || !isKvConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "not_configured",
          message: "RESEND_API_KEY or Vercel KV is missing.",
        },
      },
      { status: 500 }
    );
  }

  try {
    const prefs = await getDigestPreferences();
    if (!prefs.email) {
      return NextResponse.json(
        {
          error: {
            code: "no_recipient",
            message: "Set a recipient email in the digest section first.",
          },
        },
        { status: 400 }
      );
    }
    const result = await sendDigest();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed.";
    return NextResponse.json(
      { error: { code: "send_failed", message } },
      { status: 502 }
    );
  }
}
