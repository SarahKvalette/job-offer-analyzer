import type { JobAnalysis } from "@/lib/schemas/analysis";

/**
 * Pre-computed French example analyses for the landing page.
 *
 * These let a first-time visitor see a full analysis **instantly, for free,
 * and reliably** — no API call, no Groq quota spent, no rate-limit hit. They
 * are shown read-only (no tracking / generation / history writes).
 *
 * Invariants, enforced by `demo-analyses-fr.test.ts`:
 *   - `analysis` validates against `jobAnalysisSchema`.
 *   - Every quoted `evidence` / `phrase` is a verbatim substring of `jobText`,
 *     so the source highlighter lights it up in the posting.
 *
 * `id` is stable and prefixed `demo-` so the UI can recognise an example.
 */
export type DemoAnalysis = {
  id: string;
  /** Short button label on the landing page. */
  label: string;
  /** One-line teaser under the label. */
  teaser: string;
  company: string;
  jobTitle: string;
  jobText: string;
  analysis: JobAnalysis;
};

const PRODUCT_DESIGNER: DemoAnalysis = {
  id: "demo-fr-product-designer",
  label: "Product Designer",
  teaser: "Une offre saine, salaire affiché",
  company: "Malt",
  jobTitle: "Product Designer (H/F)",
  jobText: `Product Designer (H/F) — Malt, Paris

Malt est la plateforme leader du freelancing en Europe. Nous recherchons un Product Designer confirmé pour rejoindre notre équipe Produit (product trio : PM, Designer, Tech Lead).

Vos missions :
- Mener la discovery : entretiens utilisateurs, ateliers de cadrage, tests d'utilisabilité.
- Concevoir des parcours de bout en bout dans Figma, du wireframe au prototype haute fidélité.
- Faire vivre et enrichir notre Design System avec les autres designers.

Profil recherché :
- 4 à 6 ans d'expérience en Product Design sur des produits numériques.
- Maîtrise de Figma et solide culture de la recherche utilisateur.
- Vous savez défendre vos décisions de design avec des données.

Conditions :
- CDI, salaire 52 000 à 62 000 € brut par an selon expérience.
- Hybride : 2 jours de télétravail par semaine.
- Mutuelle, 7 semaines de congés, budget conférences.`,
  analysis: {
    verdict: {
      score: 7.5,
      sentiment: "apply",
      oneLiner:
        "Une offre de Product Designer saine : fourchette de salaire affichée, missions claires et séniorité cohérente.",
    },
    company: {
      sizeEstimate: "scaleup",
      industry: "Freelancing / marketplace",
      stage: null,
      funding: null,
      techStack: ["Figma"],
      perks: ["Mutuelle", "7 semaines de congés", "Budget conférences"],
      cultureSignals: [
        {
          phrase: "product trio",
          meaning:
            "Organisation produit mature : le designer décide à parts égales avec le PM et le Tech Lead.",
        },
      ],
    },
    meta: {
      title: "Product Designer (H/F)",
      company: "Malt",
      location: "Paris",
      remote: "hybrid",
      contractType: "CDI",
      salaryRange: { min: 52000, max: 62000, currency: "EUR" },
      seniorityAnnounced: "mid",
    },
    skills: {
      required: [
        { name: "Figma", evidence: "Maîtrise de Figma" },
        {
          name: "Recherche utilisateur",
          evidence: "solide culture de la recherche utilisateur",
        },
        { name: "Design System", evidence: "enrichir notre Design System" },
      ],
      niceToHave: [
        {
          name: "Prototypage haute fidélité",
          evidence: "du wireframe au prototype haute fidélité",
        },
      ],
      impliedButUnstated: [
        {
          name: "Animation d'ateliers",
          reason:
            "La discovery citée suppose de savoir faciliter des ateliers avec les parties prenantes.",
        },
      ],
    },
    realityCheck: {
      redFlags: [],
      greenFlags: [
        {
          phrase: "salaire 52 000 à 62 000 € brut par an",
          why: "Fourchette de salaire affichée : signe de transparence et de maturité RH.",
        },
        {
          phrase: "product trio",
          why: "Le designer travaille à parité avec le produit et la tech, pas en simple exécutant.",
        },
      ],
      seniorityRealVsAnnounced: {
        real: "mid",
        reasoning:
          "4 à 6 ans demandés et conception autonome de bout en bout : un profil confirmé, cohérent avec l'intitulé.",
      },
    },
    questionsToAsk: [
      "Comment le product trio se répartit-il les décisions au quotidien ?",
      "À quoi ressemblent les trois premiers mois sur ce poste ?",
      "Quelle est la maturité actuelle du Design System et qui en est responsable ?",
      "Comment mesurez-vous l'impact du design sur le produit ?",
    ],
  },
};

const DESIGNER_TOUCHE_A_TOUT: DemoAnalysis = {
  id: "demo-fr-designer-polyvalent",
  label: "Designer « polyvalent »",
  teaser: "Cumul de rôles, aucun salaire",
  company: "—",
  jobTitle: "Designer UI/UX",
  jobText: `DESIGNER UI/UX ROCKSTAR 🚀 — rejoins l'aventure !

Startup en hypercroissance, nous cherchons notre futur(e) Designer senior polyvalent, un vrai couteau suisse prêt à tout gérer dans une ambiance start-up et une équipe comme une famille.

Tes missions (non exhaustives) :
- Design UI/UX de l'app mobile et du site.
- Intégration front en HTML/CSS (et un peu de React, c'est un plus).
- Création des visuels marketing et gestion des réseaux sociaux.
- Un peu de gestion de projet quand il faut.

Profil :
- 2 ans d'expérience minimum, mais l'état d'esprit compte plus que le CV.
- Autonomie totale, tu sais avancer seul(e) sans qu'on te tienne la main.
- Poste à pourvoir ASAP, on recrute vite !

Rémunération : selon profil. Télétravail : à voir ensemble.`,
  analysis: {
    verdict: {
      score: 3.5,
      sentiment: "avoid",
      oneLiner:
        "Un poste fourre-tout : design, front et marketing cumulés, aucun salaire affiché et un « senior » demandé avec 2 ans d'expérience.",
    },
    company: {
      sizeEstimate: "startup",
      industry: null,
      stage: null,
      funding: null,
      techStack: ["HTML/CSS", "React"],
      perks: [],
      cultureSignals: [
        {
          phrase: "une équipe comme une famille",
          meaning:
            "Formule qui masque souvent des frontières floues entre vie pro et perso, et des heures supplémentaires implicites.",
        },
        {
          phrase: "ambiance start-up",
          meaning:
            "Souvent synonyme de moyens limités et de rythme intense sans contrepartie claire.",
        },
      ],
    },
    meta: {
      title: "Designer UI/UX",
      company: null,
      location: null,
      remote: "unknown",
      contractType: null,
      salaryRange: null,
      seniorityAnnounced: "senior",
    },
    skills: {
      required: [
        {
          name: "Design UI/UX",
          evidence: "Design UI/UX de l'app mobile et du site",
        },
        {
          name: "Intégration front HTML/CSS",
          evidence: "Intégration front en HTML/CSS",
        },
      ],
      niceToHave: [
        { name: "React", evidence: "et un peu de React, c'est un plus" },
      ],
      impliedButUnstated: [
        {
          name: "Marketing & community management",
          reason:
            "« Création des visuels marketing et gestion des réseaux sociaux » ajoute un métier entier au poste de designer.",
        },
        {
          name: "Gestion de projet",
          reason:
            "« Un peu de gestion de projet quand il faut » élargit encore un périmètre déjà très large.",
        },
      ],
    },
    realityCheck: {
      redFlags: [
        {
          phrase: "Designer senior polyvalent",
          translation:
            "Intitulé « senior » mais 2 ans d'expérience demandés : décalage entre le niveau affiché et le profil réel.",
          severity: "high",
        },
        {
          phrase: "un vrai couteau suisse prêt à tout gérer",
          translation:
            "Cumul de rôles : design, intégration front et marketing réunis sur un seul poste.",
          severity: "high",
        },
        {
          phrase: "Rémunération : selon profil",
          translation:
            "Aucune fourchette de salaire : manque de transparence et position de négociation affaiblie.",
          severity: "high",
        },
        {
          phrase: "ROCKSTAR",
          translation:
            "Formule creuse qui valorise le dévouement plutôt que des conditions de travail claires.",
          severity: "medium",
        },
        {
          phrase: "Autonomie totale, tu sais avancer seul",
          translation:
            "« Autonomie » présentée sans cadre ni accompagnement : risque d'isolement et d'absence de mentorat.",
          severity: "medium",
        },
        {
          phrase: "Poste à pourvoir ASAP, on recrute vite",
          translation:
            "Urgence artificielle qui pousse à décider sans prendre le temps d'évaluer.",
          severity: "medium",
        },
      ],
      greenFlags: [],
      seniorityRealVsAnnounced: {
        real: "junior",
        reasoning:
          "2 ans d'expérience demandés malgré l'intitulé « senior » : le poste correspond à un profil junior.",
      },
    },
    questionsToAsk: [
      "Quelle est la fourchette de salaire prévue pour ce poste ?",
      "Quelle part de mon temps serait consacrée au design produit par rapport au marketing ?",
      "Qui prend les décisions de design aujourd'hui dans l'équipe ?",
      "Pourquoi le poste est-il ouvert, et depuis combien de temps ?",
      "Comment se passe l'accompagnement quand on rejoint l'équipe ?",
    ],
  },
};

const DEV_FRONT: DemoAnalysis = {
  id: "demo-fr-dev-front",
  label: "Développeur Front React",
  teaser: "Stack claire, fourchette affichée",
  company: "Doctolib",
  jobTitle: "Développeur Front-End React (CDI)",
  jobText: `Développeur Front-End React (CDI) — Doctolib, Nantes

Rejoignez une équipe Front de Doctolib pour construire des interfaces utilisées par des millions de patients et de soignants.

Ce que vous ferez :
- Développer des composants React / TypeScript accessibles et performants.
- Collaborer avec les designers et les PM au sein d'une feature team.
- Participer aux revues de code et à l'amélioration continue de notre Design System.

Ce que nous cherchons :
- 3 ans et plus d'expérience en développement front moderne.
- Bonne maîtrise de React, TypeScript et des tests automatisés.
- Sensibilité à l'accessibilité et à la performance web.

Ce que nous offrons :
- CDI, rémunération 45 000 à 55 000 € selon profil.
- Télétravail hybride, 3 jours à distance.
- Parcours de formation et mobilité interne.`,
  analysis: {
    verdict: {
      score: 7,
      sentiment: "apply",
      oneLiner:
        "Un poste front solide et transparent : stack claire, fourchette affichée et attention portée à l'accessibilité.",
    },
    company: {
      sizeEstimate: "enterprise",
      industry: "E-santé",
      stage: null,
      funding: null,
      techStack: ["React", "TypeScript"],
      perks: ["Parcours de formation", "Mobilité interne"],
      cultureSignals: [
        {
          phrase: "feature team",
          meaning:
            "Équipe pluridisciplinaire autonome : le front travaille directement avec le design et le produit.",
        },
      ],
    },
    meta: {
      title: "Développeur Front-End React",
      company: "Doctolib",
      location: "Nantes",
      remote: "hybrid",
      contractType: "CDI",
      salaryRange: { min: 45000, max: 55000, currency: "EUR" },
      seniorityAnnounced: "mid",
    },
    skills: {
      required: [
        {
          name: "React / TypeScript",
          evidence: "Développer des composants React / TypeScript",
        },
        { name: "Tests automatisés", evidence: "des tests automatisés" },
        {
          name: "Accessibilité",
          evidence: "Sensibilité à l'accessibilité et à la performance web",
        },
      ],
      niceToHave: [
        {
          name: "Design System",
          evidence: "l'amélioration continue de notre Design System",
        },
      ],
      impliedButUnstated: [
        {
          name: "Environnement réglementé (santé)",
          reason:
            "Un produit de santé implique des contraintes de confidentialité et de conformité rarement explicitées dans l'annonce.",
        },
      ],
    },
    realityCheck: {
      redFlags: [],
      greenFlags: [
        {
          phrase: "rémunération 45 000 à 55 000 € selon profil",
          why: "Fourchette de salaire affichée dès l'annonce.",
        },
        {
          phrase: "Sensibilité à l'accessibilité",
          why: "L'accessibilité citée comme critère : signe d'une culture produit attentive aux utilisateurs.",
        },
      ],
      seniorityRealVsAnnounced: {
        real: "mid",
        reasoning:
          "3 ans et plus demandés avec autonomie sur les composants : un profil confirmé.",
      },
    },
    questionsToAsk: [
      "Comment est organisée la collaboration entre les designers et les développeurs ?",
      "Quelle est votre approche des tests et de la qualité du code ?",
      "Comment l'accessibilité est-elle suivie au quotidien dans les équipes ?",
      "Quelles sont les possibilités d'évolution après ce poste ?",
    ],
  },
};

export const DEMO_ANALYSES_FR: readonly DemoAnalysis[] = [
  PRODUCT_DESIGNER,
  DESIGNER_TOUCHE_A_TOUT,
  DEV_FRONT,
];

export function getDemoById(id: string): DemoAnalysis | null {
  return DEMO_ANALYSES_FR.find((demo) => demo.id === id) ?? null;
}

export function isDemoId(id: string): boolean {
  return id.startsWith("demo-");
}
