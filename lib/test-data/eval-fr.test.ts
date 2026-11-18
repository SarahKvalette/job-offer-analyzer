import { appendFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { EVAL_POSTINGS_FR } from "./eval-postings-fr";
import { verifyAnalysisEvidence } from "@/lib/analysis/verify-evidence";
import { detectLanguage } from "@/lib/analysis/detect-language";

/**
 * Live evaluation — hits the running dev server, so it is NOT part of the
 * normal suite. Run explicitly against a running `npm run dev`:
 *
 *   RUN_LIVE_EVAL=1 npx vitest run lib/test-data/eval-fr.test.ts
 *
 * Prints a results table (score, signals, citation validity) per posting.
 */
const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";
const OUT = process.env.EVAL_OUT_FILE ?? "/tmp/eval-table.txt";

describe.runIf(process.env.RUN_LIVE_EVAL)("FR analysis eval (live)", () => {
  it(
    "runs the 10 postings and prints a results table",
    async () => {
      const header =
        "id | dom | lang | détectée | douteux | note | sentiment | rouges | verts | séniorité | citations | flags non sourcés";
      appendFileSync(OUT, header + "\n");
      let count = 0;
      for (const p of EVAL_POSTINGS_FR) {
        let row: string;
        try {
          const res = await fetch(`${BASE}/api/analyze`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jobText: p.jobText }),
          });
          if (!res.ok) {
            row = `${p.id} | ${p.domain} | ${p.lang} | — | ${
              p.suspicious ? "oui" : "non"
            } | ERREUR ${res.status}`;
          } else {
            const { analysis } = await res.json();
            const rep = verifyAnalysisEvidence(analysis, p.jobText);
            row = [
              p.id,
              p.domain,
              p.lang,
              detectLanguage(p.jobText),
              p.suspicious ? "oui" : "non",
              analysis.verdict?.score ?? "—",
              analysis.verdict?.sentiment ?? "—",
              analysis.realityCheck.redFlags.length,
              analysis.realityCheck.greenFlags.length,
              analysis.realityCheck.seniorityRealVsAnnounced.real,
              `${rep.sourced}/${rep.total}`,
              rep.unsourcedFlagCount,
            ].join(" | ");
          }
        } catch (err) {
          row = `${p.id} | ${p.domain} | ${p.lang} | EXCEPTION ${String(err)}`;
        }
        appendFileSync(OUT, row + "\n");
        count++;
      }
      appendFileSync(OUT, "===DONE===\n");
      expect(count).toBe(EVAL_POSTINGS_FR.length);
    },
    600000
  );
});
