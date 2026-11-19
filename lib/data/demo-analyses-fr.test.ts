import { describe, it, expect } from "vitest";
import { DEMO_ANALYSES_FR } from "./demo-analyses-fr";
import { jobAnalysisSchema } from "@/lib/schemas/analysis";

describe("demo analyses (FR)", () => {
  it("exposes three stable, demo-prefixed examples with unique ids", () => {
    expect(DEMO_ANALYSES_FR).toHaveLength(3);
    const ids = DEMO_ANALYSES_FR.map((d) => d.id);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(id.startsWith("demo-")).toBe(true);
  });

  for (const demo of DEMO_ANALYSES_FR) {
    describe(demo.id, () => {
      it("validates against the analysis schema", () => {
        const parsed = jobAnalysisSchema.safeParse(demo.analysis);
        expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      });

      it("quotes only verbatim substrings of the posting", () => {
        const { jobText, analysis } = demo;
        const quotes: string[] = [
          ...analysis.skills.required.map((s) => s.evidence),
          ...analysis.skills.niceToHave.map((s) => s.evidence),
          ...analysis.realityCheck.redFlags.map((f) => f.phrase),
          ...analysis.realityCheck.greenFlags.map((f) => f.phrase),
          ...(analysis.company?.cultureSignals.map((c) => c.phrase) ?? []),
        ];
        for (const quote of quotes) {
          expect(
            jobText.includes(quote),
            `"${quote}" is not a verbatim substring of the posting`
          ).toBe(true);
        }
      });
    });
  }
});
