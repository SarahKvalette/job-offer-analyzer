import { describe, it, expect } from "vitest";
import { mergeRedFlags } from "./merge-flags";

const llm = (phrase: string, severity: "low" | "medium" | "high" = "low") => ({
  phrase,
  translation: "translated by LLM",
  severity,
});

describe("mergeRedFlags", () => {
  it("returns only LLM flags when text has no FR matches", () => {
    const out = mergeRedFlags([llm("fast-paced")], "The team moves fast and breaks things.");
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("llm");
  });

  it("returns only FR flags when LLM array is empty", () => {
    const out = mergeRedFlags([], "Vous êtes un couteau-suisse passionné.");
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((f) => f.source === "fr-dictionary")).toBe(true);
  });

  it("preserves LLM order, appends FR additions after", () => {
    const out = mergeRedFlags(
      [llm("fast-paced"), llm("rockstar")],
      "Esprit guerrier requis. Rejoignez l'aventure."
    );
    expect(out[0].phrase).toBe("fast-paced");
    expect(out[1].phrase).toBe("rockstar");
    expect(out.slice(2).every((f) => f.source === "fr-dictionary")).toBe(true);
  });

  it("does NOT duplicate when LLM already reported the same phrase", () => {
    const llmFlag = llm("esprit guerrier", "high");
    const out = mergeRedFlags([llmFlag], "Esprit guerrier attendu.");
    const guerrier = out.filter((f) =>
      f.phrase.toLowerCase().includes("esprit guerrier")
    );
    expect(guerrier).toHaveLength(1);
    expect(guerrier[0].source).toBe("llm");
  });

  it("does NOT duplicate when LLM phrase contains the FR canonical", () => {
    // LLM produced a slightly different surface form ("notre famille Acme")
    // that contains the canonical "famille" — the FR hit should be skipped.
    const llmFlag = llm("notre famille Acme");
    const out = mergeRedFlags([llmFlag], "Chez Acme, comme une famille.");
    expect(out.filter((f) => f.phrase.toLowerCase().includes("famille"))).toHaveLength(1);
  });

  it("FR additions carry source='fr-dictionary' and an advice", () => {
    const out = mergeRedFlags([], "Esprit guerrier et challenge permanent.");
    const frFlags = out.filter((f) => f.source === "fr-dictionary");
    expect(frFlags.length).toBeGreaterThanOrEqual(2);
    for (const f of frFlags) {
      expect(f.advice).toBeDefined();
      expect(f.advice!.length).toBeGreaterThan(0);
    }
  });

  it("LLM flags do NOT have an advice (it's FR-only)", () => {
    const out = mergeRedFlags([llm("rockstar")], "");
    expect(out[0].source).toBe("llm");
    expect(out[0].advice).toBeUndefined();
  });
});
