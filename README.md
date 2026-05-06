# Job Offer Analyzer

Decode any tech job posting in 10 seconds. Paste a job offer, get the **real** seniority, hidden red flags, the skills they forgot to list, and 3-5 questions to ask the recruiter.

Powered by Claude Sonnet 4.5 via Anthropic's tool use API for guaranteed structured output. Every red flag and skill cites a verbatim quote from the source — hover to highlight it in the original posting.

## Stack

- **Next.js 16** (App Router, React 19, Server Components)
- **TypeScript** strict
- **Tailwind v4** + **shadcn/ui**
- **`@anthropic-ai/sdk`** with `tool_choice: { type: "tool", name: "extract_job_analysis" }` — no JSON parsing, no regex
- **Zod** as the single source of truth: types are inferred from the schema, the JSON Schema sent to Claude is generated from the same schema
- **localStorage** for the last 10 analyses (no DB)

## Run locally

```bash
pnpm install
cp .env.example .env.local      # then add your Anthropic key
pnpm dev
```

## Deploy

```bash
vercel              # preview
vercel --prod       # production
```

Set `ANTHROPIC_API_KEY` in the Vercel project's environment variables (`vercel env add ANTHROPIC_API_KEY`).

## Architecture

```
app/
  api/analyze/route.ts          # POST → JobAnalysis JSON
  page.tsx                      # RSC, reads ?id= and hands off to client shell
  layout.tsx                    # theme, sidebar, toaster
components/
  analyze/                      # 4 result sections + source highlighter + skeleton
  history/                      # localStorage-backed sidebar
lib/
  anthropic/client.ts           # SDK singleton + analyzeJobPosting()
  prompts/extract-job.ts        # system prompt + tool schema (generated from Zod)
  schemas/analysis.ts           # JobAnalysis Zod schema (source of truth)
  storage/history.ts            # localStorage wrapper, typed
  errors.ts                     # AnalysisError + toApiError
```

## How the extraction works

1. The user pastes a posting into a textarea
2. `POST /api/analyze` sends the text to Claude with one tool: `extract_job_analysis`
3. `tool_choice` forces the model to call that tool — the response is guaranteed structured
4. The tool's `input` is validated against the Zod schema before we trust it
5. The result is saved to `localStorage` and rendered in 4 sections

The prompt explicitly requires every `evidence` and `phrase` field to be a verbatim quote from the source, which lets the UI highlight the corresponding span in the original text on hover.

## What's next

- Phase 2: CV upload (PDF) + skill matching against a posting
- Phase 3: side-by-side comparison of multiple postings
