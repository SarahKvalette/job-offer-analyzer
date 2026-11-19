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
import {
  buildGenerationPrompt,
  type GenerationKind,
  type GenerationTone,
} from "@/lib/prompts/generate-content";
import { detectLanguage, languageLabel } from "@/lib/analysis/detect-language";
import { verifyAnalysisEvidence } from "@/lib/analysis/verify-evidence";

// Groq decommissioned llama-3.3-70b-versatile; gpt-oss-120b is the current
// flagship with function-calling support (free tier).
const MODEL = "openai/gpt-oss-120b";
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

/**
 * One extraction round-trip: forced tool call → JSON parse → Zod validation.
 * Throws AnalysisError (mapped to an HTTP error by the route).
 */
async function callExtractOnce(
  client: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<JobAnalysis> {
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
      messages,
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
  const language = detectLanguage(trimmed);

  const baseMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: extractSystemPrompt },
    {
      role: "user",
      content: `Detected language: ${languageLabel(
        language
      )}. Respond entirely in that language.\n\nAnalyze the following job posting:\n\n<posting>\n${trimmed}\n</posting>`,
    },
  ];

  const first = await callExtractOnce(client, baseMessages);
  const firstReport = verifyAnalysisEvidence(first, trimmed);

  // "Good enough": no fabricated flag quotes and most quotes are sourced.
  const acceptable =
    firstReport.unsourcedFlagCount === 0 &&
    (firstReport.total === 0 || firstReport.sourced / firstReport.total >= 0.6);
  if (acceptable) return first;

  // One corrective re-analysis: the previous attempt quoted text that isn't
  // a verbatim substring of the posting. (brief Phase 3: "relancée une fois".)
  const retryMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    ...baseMessages,
    {
      role: "user",
      content:
        'Your previous analysis quoted text that is NOT a verbatim substring of the posting. Redo it: every "evidence" and "phrase" MUST be copied character-for-character from the posting above (keep the accents, apostrophes, « » and spacing exactly). Drop any item you cannot quote literally.',
    },
  ];

  let second: JobAnalysis;
  try {
    second = await callExtractOnce(client, retryMessages);
  } catch {
    return first; // Retry failed — the first result is still usable.
  }
  const secondReport = verifyAnalysisEvidence(second, trimmed);

  // Keep whichever has fewer unsourced quotes (tie → the corrected retry).
  const firstBad = firstReport.unsourced.length + firstReport.unsourcedFlagCount;
  const secondBad =
    secondReport.unsourced.length + secondReport.unsourcedFlagCount;
  return secondBad <= firstBad ? second : first;
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

/**
 * Free-form generation: cover letter, LinkedIn message, application email,
 * interview prep, ATS keyword suggestions. The output is plain text /
 * Markdown — there's no tool call to enforce structure here.
 */
export async function generateContent(input: {
  kind: GenerationKind;
  tone: GenerationTone;
  jobText: string;
  cvText: string;
  notes?: string;
}): Promise<string> {
  if (!input.jobText?.trim()) {
    throw new AnalysisError("empty_input", "Job text is empty.");
  }
  if (!input.cvText?.trim()) {
    throw new AnalysisError(
      "empty_input",
      "Upload or paste your CV in the profile drawer first."
    );
  }

  const { system, user } = buildGenerationPrompt(input);
  const client = getClient();

  let response;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_completion_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  } catch (err) {
    throw new AnalysisError(
      "upstream_error",
      "The model is unavailable right now. Please try again in a few seconds.",
      { cause: err, status: 502 }
    );
  }

  const content = response.choices[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AnalysisError(
      "model_invalid_output",
      "The model returned an empty generation.",
      { status: 502 }
    );
  }
  return content.trim();
}
