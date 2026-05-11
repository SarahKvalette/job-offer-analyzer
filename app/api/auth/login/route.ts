import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  buildOwnerCookieValue,
  ownerCookieOptions,
  verifyPassword,
} from "@/lib/server/owner-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
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
      { error: { code: "bad_request", message: "Missing password." } },
      { status: 400 }
    );
  }

  if (!verifyPassword(parsed.data.password)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_credentials",
          message: "Incorrect password.",
        },
      },
      { status: 401 }
    );
  }

  const opts = ownerCookieOptions();
  const cookieStore = await cookies();
  cookieStore.set({
    name: opts.name,
    value: buildOwnerCookieValue(),
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });

  return NextResponse.json({ ok: true });
}
