import { describe, it, expect } from "vitest";
import {
  buildAnalysesExport,
  exportToJsonString,
  parseAnalysesImport,
} from "./export-import";
import type { StoredAnalysis } from "@/lib/schemas/analysis";

const ANALYSIS = {
  meta: {
    title: "Product Designer",
    company: "Malt",
    location: "Paris",
    remote: "hybrid" as const,
    contractType: "CDI",
    salaryRange: { min: 52000, max: 62000, currency: "EUR" },
    seniorityAnnounced: "mid" as const,
  },
  skills: { required: [], niceToHave: [], impliedButUnstated: [] },
  realityCheck: {
    redFlags: [],
    greenFlags: [],
    seniorityRealVsAnnounced: { real: "mid" as const, reasoning: "ok" },
  },
  questionsToAsk: ["Quelle est la fourchette de salaire ?"],
};

function entry(id: string): StoredAnalysis {
  return {
    schemaVersion: 3,
    id,
    createdAt: 1_700_000_000_000,
    jobText: `annonce ${id}`,
    analysis: ANALYSIS,
    checkedQuestions: ["Quelle est la fourchette de salaire ?"],
    contestedSignals: { "esprit start-up": { contested: true, note: "pas d'accord" } },
  };
}

describe("export/import round-trip", () => {
  it("exports a versioned envelope", () => {
    const exp = buildAnalysesExport([entry("a"), entry("b")]);
    expect(exp.type).toBe("joa-export");
    expect(exp.formatVersion).toBe(1);
    expect(exp.count).toBe(2);
  });

  it("round-trips without loss", () => {
    const original = [entry("a"), entry("b")];
    const json = exportToJsonString(original);
    const result = parseAnalysesImport(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries).toHaveLength(2);
    // Deep-equal on the meaningful fields.
    expect(result.entries[0].id).toBe("a");
    expect(result.entries[0].checkedQuestions).toEqual(
      original[0].checkedQuestions
    );
    expect(result.entries[0].contestedSignals).toEqual(
      original[0].contestedSignals
    );
    expect(result.entries[0].analysis.meta.company).toBe("Malt");
  });

  it("rejects unreadable JSON", () => {
    const r = parseAnalysesImport("{not json");
    expect(r).toEqual({ ok: false, code: "unreadable" });
  });

  it("rejects a file that is not a JOA export", () => {
    const r = parseAnalysesImport(JSON.stringify({ hello: "world" }));
    expect(r).toEqual({ ok: false, code: "wrong_type" });
  });

  it("rejects an export with no valid analyses", () => {
    const r = parseAnalysesImport(
      JSON.stringify({ type: "joa-export", analyses: [{ bad: true }] })
    );
    expect(r).toEqual({ ok: false, code: "empty" });
  });

  it("drops invalid entries but keeps valid ones", () => {
    const r = parseAnalysesImport(
      JSON.stringify({ type: "joa-export", analyses: [entry("a"), { bad: true }] })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.entries).toHaveLength(1);
    expect(r.dropped).toBe(1);
  });
});
