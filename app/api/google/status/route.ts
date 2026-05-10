import { NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/server/owner-auth";
import { isKvConfigured } from "@/lib/server/kv";
import {
  getConnectionStatus,
  isGoogleOAuthConfigured,
} from "@/lib/server/google-oauth";

export const runtime = "nodejs";

export async function GET() {
  const owner = await isOwnerSession();
  if (!owner) {
    return NextResponse.json({
      isOwner: false,
      kvConfigured: isKvConfigured(),
      oauthConfigured: isGoogleOAuthConfigured(),
      connected: false,
      email: null,
      scopes: [],
    });
  }
  if (!isKvConfigured() || !isGoogleOAuthConfigured()) {
    return NextResponse.json({
      isOwner: true,
      kvConfigured: isKvConfigured(),
      oauthConfigured: isGoogleOAuthConfigured(),
      connected: false,
      email: null,
      scopes: [],
    });
  }
  const status = await getConnectionStatus();
  return NextResponse.json({
    isOwner: true,
    kvConfigured: true,
    oauthConfigured: true,
    ...status,
  });
}
