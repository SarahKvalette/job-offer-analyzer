import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobPosting } from "@/lib/anthropic/client";
import { toApiError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  jobText: z.string().min(1),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "empty_input", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "empty_input", message: "Missing jobText." } },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeJobPosting(parsed.data.jobText);
    return NextResponse.json({ analysis });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
