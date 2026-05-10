import { NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/server/owner-auth";

export const runtime = "nodejs";

export async function GET() {
  const isOwner = await isOwnerSession();
  return NextResponse.json({ isOwner });
}
