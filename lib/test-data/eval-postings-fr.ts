import { DEMO_ANALYSES_FR } from "@/lib/data/demo-analyses-fr";

/**
 * Evaluation set for the French-first analysis (Phase 3).
 *
 * 10 postings: 6 design in French (2 deliberately dubious), 2 tech in French,
 * 2 in English. Used by `scripts/eval-fr` to produce the results table
 * (score, signals, citation validity) and to compare FR vs EN quality.
 */
export type EvalPosting = {
  id: string;
  domain: "design" | "tech";
  lang: "fr" | "en";
  suspicious: boolean;
  label: string;
  jobText: string;
};

const demoText = (id: string): string =>
  DEMO_ANALYSES_FR.find((d) => d.id === id)!.jobText;

export const EVAL_POSTINGS_FR: readonly EvalPosting[] = [
  {
    id: "d1-product-designer",
    domain: "design",
    lang: "fr",
    suspicious: false,
    label: "Product Designer (sain)",
    jobText: demoText("demo-fr-product-designer"),
  },
  {
    id: "d2-designer-polyvalent",
    domain: "design",
    lang: "fr",
    suspicious: true,
    label: "Designer polyvalent (douteux)",
    jobText: demoText("demo-fr-designer-polyvalent"),
  },
  {
    id: "d3-ux-researcher",
    domain: "design",
    lang: "fr",
    suspicious: false,
    label: "UX Researcher",
    jobText: `UX Researcher (H/F) — Back Market, Bordeaux

Nous renforçons notre équipe Recherche pour nourrir les décisions produit par la voix des utilisateurs.

Vos missions :
- Planifier et mener des entretiens utilisateurs et des tests d'utilisabilité.
- Synthétiser les insights et les partager en ateliers avec les product trios.
- Construire et maintenir un référentiel de recherche partagé.

Profil :
- 3 ans et plus en recherche utilisateur sur des produits numériques.
- Aisance avec les méthodes qualitatives et quantitatives.
- Excellentes capacités de synthèse et de restitution.

Conditions : CDI, 46 000 à 54 000 € brut par an, télétravail hybride 2 à 3 jours, mutuelle.`,
  },
  {
    id: "d4-product-designer-scaleup",
    domain: "design",
    lang: "fr",
    suspicious: false,
    label: "Product Designer scale-up",
    jobText: `Product Designer confirmé — Pennylane, Paris (hybride)

Pennylane, scale-up fintech (Série C), cherche un Product Designer pour une feature team.

Ce que vous ferez :
- Concevoir des interfaces claires pour des problématiques comptables complexes.
- Mener la discovery avec le PM et les utilisateurs.
- Contribuer au Design System avec les autres designers.

Profil recherché :
- 4 ans et plus en Product Design.
- Maîtrise de Figma et goût pour les sujets complexes.

Conditions : CDI, rémunération 50 000 à 60 000 €, BSPCE, télétravail hybride, processus de recrutement en 3 étapes décrit sur notre page carrières.`,
  },
  {
    id: "d5-uiux-startup-douteux",
    domain: "design",
    lang: "fr",
    suspicious: true,
    label: "UX/UI startup (douteux)",
    jobText: `UX/UI Designer — startup dynamique en pleine croissance 🚀

On cherche notre premier designer, un profil autonome qui n'a pas peur de mettre les mains dans le cambouis. Esprit start-up obligatoire !

Missions :
- Tout le design produit, de l'idée à la livraison.
- Un peu de branding et de contenu pour les réseaux.
- Autonomie totale : ici, personne ne vous tiendra la main.

Profil : 2 ans d'expérience, mais surtout l'envie. Poste à pourvoir immédiatement.

Contrat : freelance ou CDI, à discuter. Rémunération selon profil.`,
  },
  {
    id: "d6-design-ops",
    domain: "design",
    lang: "fr",
    suspicious: false,
    label: "Design Ops / Design System",
    jobText: `Designer Design System (H/F) — Decathlon, Lille

Au sein de l'équipe Design System, vous outillez les designers et développeurs de tout le groupe.

Missions :
- Maintenir et faire évoluer la bibliothèque de composants dans Figma.
- Documenter les usages et accompagner les équipes.
- Veiller à l'accessibilité et à la cohérence visuelle.

Profil : 5 ans et plus en design produit, expérience sur un Design System, sensibilité à l'accessibilité.

Conditions : CDI, 48 000 à 58 000 € selon profil, télétravail hybride, parcours de formation interne.`,
  },
  {
    id: "t1-dev-front-react",
    domain: "tech",
    lang: "fr",
    suspicious: false,
    label: "Développeur Front React",
    jobText: demoText("demo-fr-dev-front"),
  },
  {
    id: "t2-data-engineer",
    domain: "tech",
    lang: "fr",
    suspicious: false,
    label: "Data Engineer",
    jobText: `Data Engineer (CDI) — Qonto, Paris / remote

Vous construisez les pipelines de données qui alimentent nos produits et notre analytics.

Missions :
- Concevoir et maintenir des pipelines ETL en Python et SQL.
- Modéliser les données avec dbt sur notre entrepôt Snowflake.
- Collaborer avec les équipes data et produit.

Profil : 3 ans et plus en data engineering, bonne maîtrise de Python, SQL et des bonnes pratiques de tests.

Conditions : CDI, 55 000 à 68 000 € selon profil, télétravail possible, tickets restaurant.`,
  },
  {
    id: "e1-product-designer-en",
    domain: "design",
    lang: "en",
    suspicious: false,
    label: "Product Designer (EN)",
    jobText: `Product Designer — Figma, London (hybrid)

We're looking for a Product Designer to join a cross-functional product team.

What you'll do:
- Lead end-to-end design, from discovery to polished UI.
- Run user research and usability testing.
- Contribute to our design system alongside other designers.

What we're looking for:
- 4+ years in product design for digital products.
- Strong command of Figma and a solid research culture.

What we offer: salary £65,000–£80,000, equity, hybrid remote, a clearly described 4-step interview process.`,
  },
  {
    id: "e2-rockstar-en",
    domain: "tech",
    lang: "en",
    suspicious: true,
    label: "Rockstar engineer (EN, douteux)",
    jobText: `Rockstar Full-Stack Engineer 🚀 — join the family!

Fast-paced startup looking for a 10x ninja who can wear many hats. We're like a family here and we move fast.

You'll do:
- Everything, frontend to backend, plus some DevOps and a bit of design.
- Work hard, play hard — we need someone available.

Requirements: "senior" mindset, 2 years minimum, able to work autonomously with no hand-holding. ASAP start.

Compensation: competitive salary. Remote: we'll see.`,
  },
];
