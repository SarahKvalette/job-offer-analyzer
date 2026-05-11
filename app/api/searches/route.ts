import { NextResponse } from "next/server";
import { ownerCheck } from "@/lib/server/owner-auth";
import { isKvConfigured } from "@/lib/server/kv";
import {
  createSavedSearch,
  listSavedSearches,
} from "@/lib/server/discover";
import { savedSearchPatchSchema } from "@/lib/schemas/discover";
import { SOURCE_ADAPTERS } from "@/lib/server/sources";

export const runtime = "nodejs";

export async function GET() {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
  const searches = isKvConfigured() ? await listSavedSearches() : [];
  return NextResponse.json({
    searches,
    kvConfigured: isKvConfigured(),
    sources: {
      remotive: SOURCE_ADAPTERS.remotive.isConfigured(),
      francetravail: SOURCE_ADAPTERS.francetravail.isConfigured(),
    },
  });
}

export async function POST(request: Request) {
  const owner = await ownerCheck();
  if (!owner.ok) {
    return NextResponse.json(owner.body, { status: owner.status });
  }
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: { code: "kv_unconfigured", message: "Vercel KV is not set up." } },
      { status: 503 }
    );
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
  const parsed = savedSearchPatchSchema.safeParse(payload);
  if (!parsed.success || !parsed.data.label) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "A label is required." } },
      { status: 400 }
    );
  }
  const created = await createSavedSearch(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
