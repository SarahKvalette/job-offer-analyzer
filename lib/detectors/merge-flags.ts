import type { JobAnalysis } from "@/lib/schemas/analysis";
import { detectRedFlagsFR } from "./red-flags-fr";

export type RedFlagSource = "llm" | "fr-dictionary";

export interface MergedRedFlag {
  phrase: string;
  translation: string;
  severity: "low" | "medium" | "high";
  source: RedFlagSource;
  /** Practical recruiter-question for FR-dictionary entries. */
  advice?: string;
}

/**
 * Merge LLM-extracted red flags with the deterministic FR dictionary.
 *
 * Dedup strategy: an FR-dictionary hit is dropped if either
 *   (a) its verbatim phrase is also reported by the LLM, or
 *   (b) its canonical key is contained in any LLM phrase
 * — this prevents showing the same warning twice through two channels.
 *
 * Order: LLM flags first (their original ordering preserved), then FR-only
 * additions appended in dictionary scan order.
 */
export function mergeRedFlags(
  llmFlags: JobAnalysis["realityCheck"]["redFlags"],
  jobText: string
): MergedRedFlag[] {
  const fromLlm: MergedRedFlag[] = llmFlags.map((f) => ({
    phrase: f.phrase,
    translation: f.translation,
    severity: f.severity,
    source: "llm",
  }));

  const fromDict = detectRedFlagsFR(jobText);
  if (fromDict.length === 0) return fromLlm;

  const llmPhraseSet = new Set(
    llmFlags.map((f) => f.phrase.toLowerCase())
  );
  const llmPhrasesLower = llmFlags.map((f) => f.phrase.toLowerCase());

  const fromDictDedup: MergedRedFlag[] = fromDict
    .filter((d) => !llmPhraseSet.has(d.phrase.toLowerCase()))
    .filter((d) => {
      const canonicalLower = d.canonical.toLowerCase();
      return !llmPhrasesLower.some((p) => p.includes(canonicalLower));
    })
    .map((d) => ({
      phrase: d.phrase,
      translation: d.translation,
      severity: d.severity,
      source: "fr-dictionary",
      advice: d.advice,
    }));

  return [...fromLlm, ...fromDictDedup];
}
