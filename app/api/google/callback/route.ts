import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ownerCheck } from "@/lib/server/owner-auth";
import { exchangeCodeAndStore } from "@/lib/server/google-oauth";
import { OAUTH_STATE_COOKIE } from "@/lib/server/google-oauth-state";

export const runtime = "nodejs";

function fail(reason: string) {
  const url = new URL(
    "/",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  );
  url.searchParams.set("google_error", reason);
  return NextResponse.redirect(url);
}

function succeed(email: string | null) {
  const url = new URL(
    "/",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  );
  url.searchParams.set("google_connected", email ?? "1");
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  // Owner gate: even though Google verified the user, we still want only
  // the owner to be able to swap our stored tokens out.
  const owner = await ownerCheck();
  if (!owner.ok) {
    return fail("not_owner");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");
  if (errParam) return fail(errParam);
  if (!code || !state) return fail("missing_params");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) {
    return fail("state_mismatch");
  }

  try {
    const stored = await exchangeCodeAndStore(code);
    return succeed(stored.email);
  } catch (err) {
    console.error("google callback error", err);
    return fail("exchange_failed");
  }
}
