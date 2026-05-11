import { NextResponse } from "next/server";
import { ownerCheck } from "@/lib/server/owner-auth";
import { isKvConfigured } from "@/lib/server/kv";
import {
  deleteSavedSearch,
  updateSavedSearch,
} from "@/lib/server/discover";
import { savedSearchPatchSchema } from "@/lib/schemas/discover";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
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
  const { id } = await ctx.params;
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid patch." } },
      { status: 400 }
    );
  }
  const updated = await updateSavedSearch(id, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No saved search with that id." } },
      { status: 404 }
    );
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, ctx: Ctx) {
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
  const { id } = await ctx.params;
  const ok = await deleteSavedSearch(id);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No saved search with that id." } },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
