import OpenAI from "openai";
import { AnalysisError } from "@/lib/errors";
import {
  extractJobTool,
  extractSystemPrompt,
  EXTRACT_TOOL_NAME,
} from "@/lib/prompts/extract-job";
import {
  categorizedQuestionsSchema,
  jobAnalysisSchema,
  type CategorizedQuestions,
  type JobAnalysis,
} from "@/lib/schemas/analysis";
import {
  categorizeSystemPrompt,
  categorizeTool,
  CATEGORIZE_TOOL_NAME,
} from "@/lib/prompts/categorize-questions";

const MODEL = "llama-3.3-70b-versatile";
const BASE_URL = "https://api.groq.com/openai/v1";
const MAX_INPUT_CHARS = 25_000;

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AnalysisError(
      "missing_api_key",
      "GROQ_API_KEY is not configured on the server.",
      { status: 500 }
    );
  }
  cachedClient = new OpenAI({ apiKey, baseURL: BASE_URL });
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

  let response;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      tools: [extractJobTool],
      tool_choice: {
        type: "function",
        function: { name: EXTRACT_TOOL_NAME },
      },
      messages: [
        { role: "system", content: extractSystemPrompt },
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

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (
    !toolCall ||
    toolCall.type !== "function" ||
    toolCall.function.name !== EXTRACT_TOOL_NAME
  ) {
    throw new AnalysisError(
      "model_no_tool_call",
      "The model did not return a structured analysis. Try again or shorten the posting.",
      { status: 502 }
    );
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.function.arguments);
  } catch (err) {
    throw new AnalysisError(
      "model_invalid_output",
      "The model returned malformed JSON.",
      { cause: err, status: 502 }
    );
  }

  const parsed = jobAnalysisSchema.safeParse(rawArgs);
  if (!parsed.success) {
    throw new AnalysisError(
      "model_invalid_output",
      "The model returned an analysis that did not match the expected shape.",
      { cause: parsed.error, status: 502 }
    );
  }

  return parsed.data;
}

/**
 * Categorise candidate questions into the four interview stages
 * (rh / technique / manager / final). The original list ordering is not
 * preserved; the resulting bucket arrays may be empty.
 *
 * Throws AnalysisError on missing key, upstream failure, or invalid model
 * output (caller maps to an HTTP error via toApiError()).
 */
export async function categorizeQuestions(
  questions: string[]
): Promise<CategorizedQuestions> {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AnalysisError(
      "empty_input",
      "No questions to categorise."
    );
  }

  const client = getClient();

  let response;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      tools: [categorizeTool],
      tool_choice: {
        type: "function",
        function: { name: CATEGORIZE_TOOL_NAME },
      },
      messages: [
        { role: "system", content: categorizeSystemPrompt },
        {
          role: "user",
          content: `Classify these questions:\n\n${questions
            .map((q, i) => `${i + 1}. ${q}`)
            .join("\n")}`,
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

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (
    !toolCall ||
    toolCall.type !== "function" ||
    toolCall.function.name !== CATEGORIZE_TOOL_NAME
  ) {
    throw new AnalysisError(
      "model_no_tool_call",
      "The model did not return a structured categorisation.",
      { status: 502 }
    );
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.function.arguments);
  } catch (err) {
    throw new AnalysisError(
      "model_invalid_output",
      "The model returned malformed JSON.",
      { cause: err, status: 502 }
    );
  }

  const parsed = categorizedQuestionsSchema.safeParse(rawArgs);
  if (!parsed.success) {
    throw new AnalysisError(
      "model_invalid_output",
      "The categorisation did not match the expected shape.",
      { cause: parsed.error, status: 502 }
    );
  }

  return parsed.data;
}
