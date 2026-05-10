import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OWNER_COOKIE_NAME } from "@/lib/server/owner-auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
