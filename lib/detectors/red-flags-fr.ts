/**
 * French red flag dictionary.
 *
 * Each entry encodes recruiter-speak that's idiomatic in French job postings
 * and may slip past the LLM. Detection is verbatim (case-insensitive,
 * accent-insensitive on the surface form), and we surface the original
 * matched span so the source highlighter still works.
 *
 * Severity tiers:
 *   - low    : annoying signal, common in most postings
 *   - medium : concerning, worth a recruiter question
 *   - high   : strong avoid signal, almost always means trouble
 */

export type RedFlagSeverity = "low" | "medium" | "high";

export interface RedFlagDictionaryEntry {
  /**
   * Pattern source (without flags). MUST be a regex string. Use `\\b` for
   * word boundaries on letter sequences and Unicode-aware `\\p{L}` if needed.
   */
  pattern: string;
  /** Human-readable canonical phrase, used for dedup and display fallback. */
  canonical: string;
  severity: RedFlagSeverity;
  /** What the recruiter actually means. */
  meaning: string;
  /** Concrete advice for the candidate. */
  advice: string;
}

/**
 * Curated dictionary. Keep entries de-duplicated by canonical text.
 * Order doesn't matter; matching is performed via regex per entry.
 */
export const RED_FLAGS_FR: ReadonlyArray<RedFlagDictionaryEntry> = [
  // ── Culture / pression ───────────────────────────────────────────────
  {
    pattern: "(?:ambiance|esprit|c[oô]t[ée]|comme une?) ?famille",
    canonical: "famille",
    severity: "high",
    meaning:
      "Frontières floues vie pro/perso, pression émotionnelle, difficile de partir.",
    advice:
      "Demande des exemples concrets de droit à la déconnexion et de turnover sur 2 ans.",
  },
  {
    pattern: "esprit guerrier|mentalit[ée] guerri[èe]re",
    canonical: "esprit guerrier",
    severity: "high",
    meaning: "Culture de surinvestissement, heures supplémentaires normalisées.",
    advice: "Demande la moyenne d'heures effectives et la politique d'astreintes.",
  },
  {
    pattern: "porter (?:plusieurs|de nombreuses) casquettes|porter de multiples casquettes",
    canonical: "porter plusieurs casquettes",
    severity: "medium",
    meaning: "Sous-effectif. Tu vas faire le boulot d'un poste et demi.",
    advice: "Demande l'organigramme et le périmètre exact du poste.",
  },
  {
    pattern: "challenge permanent|environnement (?:tr[èe]s )?challengeant",
    canonical: "challenge permanent",
    severity: "medium",
    meaning: "Stress chronique, deadlines mouvantes.",
    advice: "Demande à quoi ressemble une semaine type et les pics de charge.",
  },
  {
    pattern: "mentalit[ée] start[- ]?up|esprit start[- ]?up",
    canonical: "mentalité start-up",
    severity: "medium",
    meaning:
      "Process minimaux, chaos toléré, attentes de disponibilité étendues.",
    advice:
      "Demande les outils de planification et la fréquence des changements de priorités.",
  },
  {
    pattern: "personnalit[ée] solaire|profil solaire",
    canonical: "personnalité solaire",
    severity: "low",
    meaning:
      "Critère subjectif et flou — souvent prétexte à filtrer sur des biais.",
    advice: "Demande les critères d'évaluation concrets et mesurables du poste.",
  },
  {
    pattern: "couteau[- ]?suisse",
    canonical: "couteau-suisse",
    severity: "medium",
    meaning: "Périmètre indéfini, pas de spécialisation reconnue, sous-effectif.",
    advice: "Fais lister les responsabilités précises avec leurs proportions.",
  },
  {
    pattern: "auto[- ]?nome|tr[èe]s autonome",
    canonical: "très autonome",
    severity: "low",
    meaning: "Peu d'accompagnement, peu d'onboarding, peu de management.",
    advice: "Demande à quoi ressemble l'onboarding sur les 3 premiers mois.",
  },
  {
    pattern: "passionn[ée]\\(?e?\\)?",
    canonical: "passionné·e",
    severity: "low",
    meaning:
      "Souvent code pour : on attend que tu travailles au-delà des heures payées.",
    advice: "Demande la politique de RTT et la moyenne réelle des congés pris.",
  },

  // ── Croissance / hyper-rythme ─────────────────────────────────────────
  {
    pattern: "hyper[- ]?croissance|forte croissance",
    canonical: "hyper-croissance",
    severity: "medium",
    meaning:
      "Réorganisations fréquentes, dette technique, postes redéfinis tous les 6 mois.",
    advice: "Demande le headcount il y a 1 an et les prévisions de recrutement.",
  },
  {
    pattern: "scale[- ]?up en pleine expansion",
    canonical: "scale-up en pleine expansion",
    severity: "low",
    meaning: "Souvent une formule marketing — vérifie le funding réel.",
    advice: "Demande les tours de table récents et le runway.",
  },
  {
    pattern: "rythme soutenu|rythme intense|rythme effr[ée]n[ée]",
    canonical: "rythme soutenu",
    severity: "medium",
    meaning: "Sous-effectif chronique, deadlines compressées.",
    advice: "Demande la moyenne des heures travaillées par semaine.",
  },

  // ── Rémunération vague ───────────────────────────────────────────────
  {
    pattern:
      "r[ée]mun[ée]ration (?:attractive|comp[ée]titive|motivante|sur ?mesure|selon profil)",
    canonical: "rémunération attractive",
    severity: "high",
    meaning:
      "Sous le marché — sinon le chiffre serait là. Quasi-toujours en dessous des grilles.",
    advice: "Demande la fourchette précise dès le 1er échange.",
  },
  {
    pattern: "package (?:comp[ée]titif|attractif|sur ?mesure|complet)",
    canonical: "package compétitif",
    severity: "high",
    meaning: "Pareil — pas de chiffre = en dessous du marché.",
    advice: "Demande le détail brut/variable/avantages chiffrés.",
  },
  {
    pattern: "salaire (?:n[ée]gociable|selon exp[ée]rience|selon profil)",
    canonical: "salaire selon profil",
    severity: "medium",
    meaning:
      "Pas de transparence salariale — risque de discrimination salariale interne.",
    advice: "Demande la grille salariale par niveau et la politique d'égalité.",
  },
  {
    pattern: "tickets restaurant|ch[èe]ques d[ée]jeuner",
    canonical: "tickets restaurant",
    severity: "low",
    meaning:
      "Avantage standard mis en avant comme un perk — souvent compensation pour le reste maigre.",
    advice: "Compare le total package au salaire de base brut chargé.",
  },

  // ── Process recrutement ──────────────────────────────────────────────
  {
    pattern: "process (?:rapide|express)",
    canonical: "process rapide",
    severity: "medium",
    meaning:
      "Soit ils ont un urgent à pourvoir (mauvais signe), soit le filtrage est superficiel.",
    advice: "Demande pourquoi le poste est ouvert et le timing visé.",
  },

  // ── Avantages flous / marketing ──────────────────────────────────────
  {
    pattern: "afterworks|babyfoot|salle de jeux",
    canonical: "babyfoot / afterworks",
    severity: "low",
    meaning: "Distraction des vrais avantages structurants (salaire, RTT, télétravail).",
    advice: "Demande la politique de télétravail écrite et le nombre de jours RTT.",
  },
  {
    pattern: "[ée]quipe bienveillante",
    canonical: "équipe bienveillante",
    severity: "low",
    meaning: "Affirmation invérifiable — souvent compensation pour autre chose.",
    advice: "Demande comment les conflits sont gérés dans l'équipe.",
  },
  {
    pattern: "environnement stimulant",
    canonical: "environnement stimulant",
    severity: "low",
    meaning: "Formule creuse, n'apporte aucune information.",
    advice: "Fais lister les vrais projets en cours et leurs objectifs.",
  },
  {
    pattern: "jeune et dynamique",
    canonical: "jeune et dynamique",
    severity: "medium",
    meaning:
      "Discrimination par l'âge déguisée. Souvent codifie aussi : peu d'expérience, peu de processus.",
    advice: "Demande la pyramide des âges de l'équipe.",
  },

  // ── Astreintes / disponibilité ───────────────────────────────────────
  {
    pattern: "disponible|disponibilit[ée] (?:rapide|imm[ée]diate)",
    canonical: "disponibilité immédiate",
    severity: "low",
    meaning: "Souvent : remplacement urgent d'un départ — turnover.",
    advice: "Demande pourquoi la personne précédente est partie.",
  },
  {
    pattern: "astreintes? possibles?",
    canonical: "astreintes possibles",
    severity: "medium",
    meaning:
      "Astreintes non négociables, souvent mal compensées si ce n'est pas écrit.",
    advice: "Demande la grille de compensation des astreintes par niveau.",
  },

  // ── Promesses creuses ────────────────────────────────────────────────
  {
    pattern: "[ée]volution rapide|[ée]volution garantie",
    canonical: "évolution rapide",
    severity: "medium",
    meaning:
      "Promesse non contractuelle — vérifie les promotions effectives sur 2 ans.",
    advice:
      "Demande combien de personnes ont été promues sur le poste les 2 dernières années.",
  },
  {
    pattern: "responsabilit[ée]s? (?:rapides?|imm[ée]diates?)",
    canonical: "responsabilités rapides",
    severity: "low",
    meaning: "Souvent : on te jettera dans le grand bain sans support.",
    advice:
      "Demande quel sera ton manager direct et comment l'onboarding est structuré.",
  },
  {
    pattern: "carte blanche|champ libre",
    canonical: "carte blanche",
    severity: "medium",
    meaning:
      "Aucun cadre, aucun support — tu réinventeras la roue tout en étant jugé sur les résultats.",
    advice:
      "Demande les outils, le budget et les process déjà en place pour ton scope.",
  },

  // ── Anglicismes corporate ────────────────────────────────────────────
  {
    pattern: "ownership|prendre en main",
    canonical: "ownership",
    severity: "low",
    meaning:
      "Tu seras seul·e responsable — mais probablement sans le pouvoir de décision associé.",
    advice:
      "Demande qui valide les décisions techniques/produit dans ton scope.",
  },
  {
    pattern: "team[- ]?player",
    canonical: "team player",
    severity: "low",
    meaning:
      "Formule passe-partout. Rarement informative seule, mais signal faible si répétée.",
    advice: "Demande comment les désaccords techniques sont arbitrés.",
  },
  {
    pattern: "rejoindre l'aventure|rejoindre une aventure",
    canonical: "rejoindre l'aventure",
    severity: "low",
    meaning:
      "Marketing recrutement — souvent associé à du sous-paiement justifié par 'la mission'.",
    advice: "Reste sur les fondamentaux : salaire écrit, périmètre écrit, process écrit.",
  },

  // ── Vagues sur l'entreprise ──────────────────────────────────────────
  {
    pattern: "mission qui a du sens",
    canonical: "mission qui a du sens",
    severity: "low",
    meaning:
      "Phrase creuse — toutes les entreprises s'en réclament. Vérifie ce qui est concret.",
    advice: "Demande l'impact mesurable du poste sur les 6 prochains mois.",
  },
  {
    pattern: "leader (?:fran[çc]ais|europ[ée]en|du march[ée])",
    canonical: "leader du marché",
    severity: "low",
    meaning: "Auto-déclaration — vérifie le CA, le headcount et les concurrents.",
    advice: "Demande les chiffres de croissance et de rentabilité publiables.",
  },
];

/**
 * Build a single anchored RegExp for a dictionary entry.
 *
 * Flags:
 *   - i  : case-insensitive
 *   - u  : Unicode-aware (so \\p{L} works if entries use it)
 *   - g  : global (we want all matches in the source)
 */
function buildPattern(entry: RedFlagDictionaryEntry): RegExp {
  return new RegExp(entry.pattern, "giu");
}

export interface DetectedFRRedFlag {
  /** The verbatim phrase as found in the source text. */
  phrase: string;
  /** Translation = `meaning` from the dictionary. */
  translation: string;
  severity: RedFlagSeverity;
  /** Always "fr" so the UI can label the source. */
  source: "fr-dictionary";
  /** Lowercased canonical form, used for dedup with LLM flags. */
  canonical: string;
  /** Practical recruiter-question advice. */
  advice: string;
}

/**
 * Run every dictionary entry against the source text and return all
 * verbatim hits. Multiple distinct hits of the same canonical entry are
 * collapsed (we keep the first hit only, with its real surface form).
 */
export function detectRedFlagsFR(text: string): DetectedFRRedFlag[] {
  if (!text || text.length === 0) return [];

  const seen = new Set<string>();
  const out: DetectedFRRedFlag[] = [];

  for (const entry of RED_FLAGS_FR) {
    if (seen.has(entry.canonical)) continue;

    const re = buildPattern(entry);
    const match = re.exec(text);
    if (!match) continue;

    seen.add(entry.canonical);
    out.push({
      phrase: match[0],
      translation: entry.meaning,
      severity: entry.severity,
      source: "fr-dictionary",
      canonical: entry.canonical,
      advice: entry.advice,
    });
  }

  return out;
}
