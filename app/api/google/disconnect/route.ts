import { NextResponse } from "next/server";
import { ownerCheck } from "@/lib/server/owner-auth";
import { disconnectGoogle } from "@/lib/server/google-oauth";

export const runtime = "nodejs";

export async function POST() {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}
