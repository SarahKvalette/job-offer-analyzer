import { NextResponse } from "next/server";
import { z } from "zod";
import { categorizeQuestions } from "@/lib/llm/client";
import { toApiError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  questions: z.array(z.string().min(1)).min(1).max(20),
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
      { error: { code: "empty_input", message: "Invalid questions list." } },
      { status: 400 }
    );
  }

  try {
    const categorized = await categorizeQuestions(parsed.data.questions);
    return NextResponse.json({ categorized });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
