# Job Offer Analyzer

Decode any tech job posting in 10 seconds. Paste a job offer (or drop a PDF, or paste a LinkedIn / WTTJ / Indeed URL, or use the Chrome extension), get the **real** seniority, hidden red flags, the skills they forgot to list, 3-5 questions to ask the recruiter, a personalised fit score against your profile, and tailored cover letters / messages / ATS keywords on demand.

Powered by Llama 3.3 70B via [Groq](https://groq.com)'s function-calling API for guaranteed structured output (free tier, sub-second latency). Every red flag and skill cites a verbatim quote from the source — hover to highlight it in the original posting.

## What it does

- **Verdict 0–10** with `apply / caution / avoid` sentiment + one-liner
- **Reality check** — red flags decoded (LLM + curated French dictionary), green flags, real vs announced seniority
- **About the company** — size estimate, stage, funding, tech stack, perks, culture signals
- **Salary card** — parsed range vs France 2025 market median, with a position bar (or amber "Not disclosed" prompt)
- **Ghost job detector** — 4-criteria score, popover with the breakdown
- **Personal fit score** — 6-dimension radar chart (salary / remote / stack / growth / balance / culture) computed locally against your profile, with strengths and frictions
- **Smart questions** to ask the recruiter, optionally categorised into RH / Technical / Hiring manager / Closing tabs
- **Tailored content generator** — cover letter / LinkedIn message / application email / interview prep / ATS keywords against your CV
- **Application tracking** — status (interested / applied / interview / offer / rejected / ignored), notes, tags, contacts, next action
- **Pipeline view** at `/pipeline` — Kanban with HTML5 drag & drop, filters, reminders banner (follow-up at 14 days)
- **Comparison view** at `/compare?ids=…` — side-by-side diff highlighting on 12 rows
- **Command palette** — ⌘K / Ctrl+K to navigate, search history, toggle theme, open drawers
- **Chrome MV3 extension** in `extension/` — 1-click analyse on LinkedIn / WTTJ / Indeed / JobTeaser

## Privacy

Everything is stored in your browser's localStorage. The Vercel deployment is stateless — it only forwards the LLM calls. The Chrome extension passes the scraped text through a URL fragment (`#analyze=…`), so the posting text never appears in server logs.

## Stack

- **Next.js 16** (App Router, React 19, Server Components)
- **TypeScript** strict
- **Tailwind v4** + **shadcn/ui** patterns over **@base-ui/react** primitives
- **`openai`** SDK pointed at Groq's OpenAI-compatible endpoint (`llama-3.3-70b-versatile`), with `tool_choice` forcing the function call — no JSON parsing, no regex
- **Zod** as the single source of truth: types are inferred from the schema, the JSON Schema sent to the model is generated from the same schema, and the response is re-validated against it
- **localStorage** for history (max 10), profile, CV — all versioned (`schemaVersion`) with migrations
- **Vitest** for unit tests (140+ tests covering schema, detectors, fit score, profile storage migrations)

## Run locally

```bash
pnpm install
cp .env.example .env.local      # then add your GROQ_API_KEY
pnpm dev
pnpm test                       # watch mode: pnpm test:watch
pnpm lint
```

Get a free Groq key at [console.groq.com](https://console.groq.com).

## Deploy

```bash
vercel              # preview
vercel --prod       # production
```

Set `GROQ_API_KEY` in the Vercel project's environment variables (`vercel env add GROQ_API_KEY`).

## Architecture

```
app/
  api/analyze/                  # POST → JobAnalysis JSON
  api/extract-pdf/              # POST file → text via pdf-parse
  api/categorize-questions/     # POST questions → grouped by interview stage
  api/generate/                 # POST { kind, tone, jobText, cvText } → string
  api/fetch-job/                # POST URL (LinkedIn/WTTJ/Indeed/JobTeaser) → text
  pipeline/                     # /pipeline — Kanban view
  compare/                      # /compare?ids=… — side-by-side
  page.tsx                      # RSC, reads ?id= and hands off to client shell
  layout.tsx                    # theme, header, drawers, palette, toaster
components/
  analyze/                      # 9 result cards + form + landing + radar
  application/                  # status pill, kanban, tracking card, reminders
  compare/                      # comparison table
  history/                      # slide-over drawer with search + grouping
  palette/                      # ⌘K command palette
  profile/                      # drawer + stack picker + tag input + sliders
  ui/                           # shadcn-style primitives
lib/
  analysis/                     # verdict fallback, fit score
  data/                         # tech stacks dataset, salary benchmarks FR
  detectors/                    # FR red flags, salary parser, benchmark, ghost job, role inference
  export/                       # markdown export
  i18n/                         # centralised UI strings
  llm/                          # Groq client wrappers (analyze, categorize, generate)
  prompts/                      # system prompts + tool schemas
  schemas/                      # Zod schemas (analysis, profile, cv)
  storage/                      # localStorage adapters with snapshot caching
extension/                       # Chrome MV3 extension (separate runtime)
```

## How the extraction works

1. The user pastes a posting / drops a PDF / pastes a URL / clicks the Chrome extension
2. `POST /api/analyze` sends the text to Groq with one function: `extract_job_analysis`
3. `tool_choice` forces the model to call that function — the response is guaranteed structured
4. The tool's `input` is validated against the Zod schema before we trust it
5. The result is saved to `localStorage` and rendered in 10+ result cards

The prompt explicitly requires every `evidence` and `phrase` field to be a verbatim quote from the source, which lets the UI highlight the corresponding span in the original text on hover.

## Phases

- **Phase 1** — Personalisation & richesse : verdict, company insights, FR red flags dictionary, salary parser + benchmark, ghost job detector, user profile drawer, fit score radar, questions tabs ✅
- **Phase 2** — CRM mini : application status, notes/tags/contacts/next action, Kanban pipeline, side-by-side comparison, reminders ✅
- **Phase 3** — Génération : CV upload, cover letter / LinkedIn / email / interview prep / ATS keywords ✅
- **Phase 4** — Automatisations : URL paste, Chrome extension MV3 ✅. Gmail / Calendar / digest email deferred (require persistent backend)
- **Phase 5** — Polish : ⌘K command palette, animated score counter, README, a11y refinements ✅

## License

Personal portfolio project. No license set — copy at your own risk.
