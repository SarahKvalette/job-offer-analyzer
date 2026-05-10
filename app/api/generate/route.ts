import { NextResponse } from "next/server";
import { z } from "zod";
import { generateContent } from "@/lib/llm/client";
import { toApiError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  kind: z.enum([
    "cover-letter",
    "linkedin-message",
    "email",
    "interview-prep",
    "ats-keywords",
  ]),
  tone: z.enum(["neutral", "enthusiastic", "direct"]).default("neutral"),
  jobText: z.string().min(1).max(25_000),
  cvText: z.string().min(1).max(25_000),
  notes: z.string().max(2_000).optional(),
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
      { error: { code: "empty_input", message: "Invalid request shape." } },
      { status: 400 }
    );
  }

  try {
    const content = await generateContent(parsed.data);
    return NextResponse.json({ content });
  } catch (err) {
    const { status, body } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
