import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobPosting } from "@/lib/llm/client";
import { toApiError } from "@/lib/errors";
import {
  checkAnalyzeRateLimit,
  RATE_LIMIT_MESSAGES,
} from "@/lib/server/ratelimit";

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

  const limit = await checkAnalyzeRateLimit(request.headers);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: RATE_LIMIT_MESSAGES[limit.scope],
        },
      },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds) },
      }
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
