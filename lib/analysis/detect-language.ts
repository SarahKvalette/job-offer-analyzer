export type PostingLanguage = "fr" | "en";

/**
 * Lightweight French/English detector for job postings — no dependency, runs
 * on the server before the LLM call. It biases the prompt ("répond en
 * français") and is stored on the entry so the UI and citation verifier know
 * the posting's language.
 *
 * Heuristic: score common function words of each language plus French-only
 * accented characters. Postings are long enough that this is reliable; ties
 * and empty input default to French (the product is French-first).
 */
const FR_WORDS = [
  "le", "la", "les", "des", "une", "un", "et", "vous", "nous", "pour",
  "avec", "dans", "votre", "notre", "au", "aux", "du", "est", "sont",
  "poste", "entreprise", "expérience", "compétences", "équipe", "recherche",
  "missions", "profil", "recrutement", "métier", "sur", "chez", "ans",
];

const EN_WORDS = [
  "the", "and", "you", "we", "for", "with", "our", "your", "are", "is",
  "role", "team", "experience", "skills", "company", "requirements",
  "responsibilities", "about", "looking", "join", "years", "work",
];

function countWords(tokens: string[], vocab: Set<string>): number {
  let n = 0;
  for (const token of tokens) if (vocab.has(token)) n++;
  return n;
}

export function detectLanguage(text: string): PostingLanguage {
  const lower = text.toLowerCase();
  const tokens = lower.split(/[^a-zàâäçéèêëîïôöùûüœ]+/i).filter(Boolean);
  if (tokens.length === 0) return "fr";

  const fr = countWords(tokens, new Set(FR_WORDS));
  const en = countWords(tokens, new Set(EN_WORDS));

  // French-only accented letters are a strong signal.
  const accents = (lower.match(/[àâäçéèêëîïôöùûœ]/g) ?? []).length;
  const frScore = fr + accents * 0.5;

  if (frScore === en) return "fr"; // French-first default on a tie.
  return frScore > en ? "fr" : "en";
}

export function languageLabel(lang: PostingLanguage): string {
  return lang === "fr" ? "français" : "anglais";
}
