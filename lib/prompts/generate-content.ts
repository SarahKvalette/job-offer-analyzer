import type OpenAI from "openai";

export type GenerationKind =
  | "cover-letter"
  | "linkedin-message"
  | "email"
  | "interview-prep"
  | "ats-keywords";

export type GenerationTone = "neutral" | "enthusiastic" | "direct";

interface BuildPromptOptions {
  kind: GenerationKind;
  tone: GenerationTone;
  jobText: string;
  cvText: string;
  notes?: string;
}

const TONE_HINTS: Record<GenerationTone, string> = {
  neutral: "Keep the tone professional and measured.",
  enthusiastic:
    "Show genuine interest and energy without being sycophantic. Avoid superlatives.",
  direct:
    "Cut filler. Lead with the candidate's strongest match in the first sentence.",
};

const KIND_BRIEFS: Record<GenerationKind, string> = {
  "cover-letter": `Draft a cover letter (3 paragraphs, ~250-320 words):
  - Paragraph 1: opening hook tying the candidate's strongest match to the role
  - Paragraph 2: 2-3 concrete experiences from the CV that map to required skills
  - Paragraph 3: short close, recruiter-friendly, leave the door open
Match the language of the posting (FR or EN). Use the recruiter's company name
exactly. No brackets, no placeholders, no [Insert your X here].`,
  "linkedin-message": `Draft a LinkedIn message to a recruiter for this role.
Hard limit: 300 characters total. Match the language of the posting. One
sentence on the candidate's strongest match, one specific question, no
emojis, no salutation longer than "Hi <FirstName>,".`,
  email: `Draft an application email (subject + body):
  - Subject: short, includes the role title
  - Body: 4-6 sentences. Lead with the strongest CV match. End with one
    specific question and a single-line signature placeholder line
    "—\\n<Your name>" (the user fills it).
Match the language of the posting. No HTML, plain text only.`,
  "interview-prep": `Generate an interview prep brief covering:
  - 5 likely technical questions specific to the stack mentioned
  - 5 behavioural questions tailored to the seniority level
  - 3 topics the candidate should research about the company
  - 1 framework answer for "what's your salary expectation?" using the
    posting's stated band when available
Output as Markdown with H2 sections. Match the language of the posting.`,
  "ats-keywords": `Identify keywords from the posting that aren't yet in the
candidate's CV. For each missing keyword, suggest one honest reformulation
of an existing CV bullet that incorporates it without inventing experience.
Output as a Markdown table: | Keyword | Suggested rewording |. Cap at 8 rows.`,
};

export function buildGenerationPrompt(options: BuildPromptOptions): {
  system: string;
  user: string;
} {
  const { kind, tone, jobText, cvText, notes } = options;

  const system = `You are a senior career coach helping a software engineer
respond to a specific job posting.

Rules — non-negotiable:
1. Use ONLY information actually in the candidate's CV. Never invent
   experience, certifications, or numbers.
2. Match the language of the posting (English or French) consistently.
3. ${TONE_HINTS[tone]}
4. Reuse vocabulary from the posting verbatim where it maps to the
   candidate's CV — this helps clear ATS filters.
5. Output ONLY the requested artifact. No preamble, no explanation, no
   "Here's your cover letter:" header.

Task — ${KIND_BRIEFS[kind]}`;

  const user = `<job-posting>
${jobText.slice(0, 8000)}
</job-posting>

<candidate-cv>
${cvText.slice(0, 8000)}
</candidate-cv>${
    notes
      ? `

<extra-notes-from-candidate>
${notes.slice(0, 1000)}
</extra-notes-from-candidate>`
      : ""
  }`;

  return { system, user };
}

/**
 * Tools-mode contract — none. Generation outputs prose, so we use a
 * regular chat completion. Schema validation happens client-side via a
 * Zod string check in the client.
 */
export const generationToolNoop: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
