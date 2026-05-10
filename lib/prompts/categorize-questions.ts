import { z } from "zod";
import type OpenAI from "openai";
import { categorizedQuestionsSchema } from "@/lib/schemas/analysis";

export const CATEGORIZE_TOOL_NAME = "categorize_questions";

export const categorizeSystemPrompt = `You are an interview-prep coach.
Given a list of questions a candidate plans to ask the recruiter, classify
each one into the most appropriate interview stage. Respect the
candidate's exact wording — do not paraphrase. Each question must appear
exactly once across the four buckets.

Stages:
- "rh"        : recruiter / HR call (process, salary band, contract, why
                the role is open, headcount, hiring timeline)
- "technique" : technical interview (stack, codebase, on-call, code
                review process, testing culture, tech debt)
- "manager"   : interview with the hiring manager (team size,
                expectations, scope, decision authority, success
                criteria, day-to-day)
- "final"     : C-level / culture round / closing (company strategy,
                long-term vision, parental leave, equity vesting,
                negotiation flexibility)

If a question fits multiple stages, pick the EARLIEST stage where it
becomes useful (RH > Technique > Manager > Final).

Respond ONLY by calling the \`${CATEGORIZE_TOOL_NAME}\` function.`;

const jsonSchema = z.toJSONSchema(categorizedQuestionsSchema, {
  target: "draft-7",
  unrepresentable: "any",
}) as Record<string, unknown>;

export const categorizeTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: CATEGORIZE_TOOL_NAME,
    description:
      "Classify each input question into one of four interview stages: rh, technique, manager, final. Each question must appear exactly once.",
    parameters: jsonSchema,
  },
};
