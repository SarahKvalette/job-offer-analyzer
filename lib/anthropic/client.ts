import Anthropic from "@anthropic-ai/sdk";
import { AnalysisError } from "@/lib/errors";
import {
  extractJobTool,
  extractSystemPrompt,
  EXTRACT_TOOL_NAME,
} from "@/lib/prompts/extract-job";
import { jobAnalysisSchema, type JobAnalysis } from "@/lib/schemas/analysis";

const MODEL = "claude-sonnet-4-5";
const MAX_INPUT_CHARS = 25_000;

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnalysisError(
      "missing_api_key",
      "ANTHROPIC_API_KEY is not configured on the server.",
      { status: 500 }
    );
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export async function analyzeJobPosting(jobText: string): Promise<JobAnalysis> {
  const trimmed = jobText.trim();
  if (trimmed.length === 0) {
    throw new AnalysisError("empty_input", "Paste a job posting first.");
  }
  if (trimmed.length > MAX_INPUT_CHARS) {
    throw new AnalysisError(
      "input_too_long",
      `Job posting is too long (${trimmed.length} characters, max ${MAX_INPUT_CHARS}).`
    );
  }

  const client = getClient();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [extractJobTool],
      tool_choice: { type: "tool", name: EXTRACT_TOOL_NAME },
      system: extractSystemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze the following job posting:\n\n<posting>\n${trimmed}\n</posting>`,
        },
      ],
    });
  } catch (err) {
    throw new AnalysisError(
      "upstream_error",
      "The model is unavailable right now. Please try again in a few seconds.",
      { cause: err, status: 502 }
    );
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === EXTRACT_TOOL_NAME
  );

  if (!toolUse) {
    throw new AnalysisError(
      "model_no_tool_call",
      "The model did not return a structured analysis. Try again or shorten the posting.",
      { status: 502 }
    );
  }

  const parsed = jobAnalysisSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new AnalysisError(
      "model_invalid_output",
      "The model returned an analysis that did not match the expected shape.",
      { cause: parsed.error, status: 502 }
    );
  }

  return parsed.data;
}
