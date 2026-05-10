import type { JobAnalysis } from "@/lib/schemas/analysis";

/**
 * Ghost job detector.
 *
 * Combines four heuristics into a 0–100 confidence score that the posting
 * is a "ghost" (not actually being filled — pipeline padding, market
 * intelligence, or simply lazy reposts). Each criterion contributes a
 * weighted 0–1 sub-score; the final number is `Math.round(weighted×100)`.
 *
 * Weights tuned so that any TWO criteria firing together cross the 50%
 * "suspect" threshold the UI uses to surface the badge.
 */

const WEIGHTS = {
  vagueDescription: 0.3,
  noSalary: 0.25,
  externalRecruiter: 0.25,
  genericCompany: 0.2,
} as const;

/** Cabinets / staffing agencies that frequently post non-existent roles. */
const EXTERNAL_RECRUITERS = [
  "hays",
  "robert walters",
  "robert half",
  "michael page",
  "pagegroup",
  "kelly services",
  "adecco",
  "manpower",
  "randstad",
  "fed it",
  "expectra",
  "page personnel",
  "talent.io recruiter",
  "approach people",
  "computer futures",
  "sthree",
];

/**
 * Concrete tech terms — appearance density acts as a proxy for "real
 * engineering posting" vs. corporate filler. List is intentionally broad,
 * we only need the count.
 */
const TECH_TERMS = [
  // Languages
  "typescript", "javascript", "python", "go", "golang", "java", "kotlin",
  "rust", "ruby", "php", "swift", "scala", "c#", "c++",
  // Frontend
  "react", "vue", "angular", "svelte", "next.js", "nextjs", "remix", "vite",
  "webpack", "tailwind", "css", "sass", "html",
  // Backend / runtime
  "node.js", "nodejs", "deno", "bun", "express", "nestjs", "django", "flask",
  "fastapi", "spring", "rails", "laravel", "graphql", "rest", "grpc",
  // Data / DB
  "postgres", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "kafka", "snowflake", "bigquery", "dbt",
  // Cloud / infra
  "aws", "gcp", "azure", "kubernetes", "docker", "terraform", "ansible",
  "ci/cd", "github actions", "gitlab ci", "jenkins",
  // Testing
  "jest", "vitest", "cypress", "playwright", "rspec", "pytest",
];

/**
 * Generic corporate fluff that signals the company section was written by
 * a marketing team rather than describing a real product.
 */
const GENERIC_PHRASES = [
  "leader du marché",
  "acteur incontournable",
  "à taille humaine",
  "valeurs fortes",
  "esprit d'équipe",
  "environnement stimulant",
  "challenges passionnants",
  "société dynamique",
  "rejoindre notre équipe",
  "rejoindre l'aventure",
  "growing company",
  "industry leader",
  "fast-paced environment",
  "exciting opportunity",
  "join our team",
  "make an impact",
];

export interface GhostJobBreakdown {
  vagueDescription: { score: number; reason: string };
  noSalary: { score: number; reason: string };
  externalRecruiter: { score: number; reason: string };
  genericCompany: { score: number; reason: string };
}

export interface GhostJobAssessment {
  /** 0–100 integer. ≥ 50 = surface the badge. */
  score: number;
  breakdown: GhostJobBreakdown;
}

function countMatches(text: string, needles: string[]): number {
  const lower = text.toLowerCase();
  return needles.reduce((acc, n) => (lower.includes(n) ? acc + 1 : acc), 0);
}

function vagueDescriptionScore(jobText: string): {
  score: number;
  reason: string;
} {
  const wordCount = jobText.trim().split(/\s+/).length;
  if (wordCount < 80) {
    return {
      score: 0.9,
      reason: `Description very short (${wordCount} words) — usually means the role isn't real or has been hastily reposted.`,
    };
  }
  const hits = countMatches(jobText, TECH_TERMS);
  // density per 200 words
  const density = (hits / wordCount) * 200;
  if (density < 1.5) {
    return {
      score: 0.8,
      reason: `Few concrete tech terms for a tech role (${hits} hits across ${wordCount} words).`,
    };
  }
  if (density < 3) {
    return {
      score: 0.4,
      reason: `Tech term density is light — borderline vague.`,
    };
  }
  return {
    score: 0,
    reason: `Description mentions ${hits} concrete tech terms — looks substantive.`,
  };
}

function noSalaryScore(meta: JobAnalysis["meta"]): {
  score: number;
  reason: string;
} {
  if (meta.salaryRange) {
    return { score: 0, reason: "Salary range disclosed." };
  }
  return {
    score: 1,
    reason: "No salary band disclosed — strong ghost-job signal.",
  };
}

function externalRecruiterScore(
  jobText: string,
  company: string | null
): { score: number; reason: string } {
  const haystack = `${company ?? ""} ${jobText}`.toLowerCase();
  for (const agency of EXTERNAL_RECRUITERS) {
    if (haystack.includes(agency)) {
      return {
        score: 1,
        reason: `Posted by external staffing agency (${agency}).`,
      };
    }
  }
  // Generic recruiter cues
  if (
    /\bcabinet de recrutement\b|\brecruitment agency\b|\bstaffing\b/i.test(
      jobText
    )
  ) {
    return {
      score: 0.7,
      reason: "Recruitment agency mentioned — middleman posting.",
    };
  }
  return { score: 0, reason: "No external recruiter detected." };
}

function genericCompanyScore(jobText: string): {
  score: number;
  reason: string;
} {
  const hits = countMatches(jobText, GENERIC_PHRASES);
  if (hits >= 4) {
    return {
      score: 1,
      reason: `${hits} generic corporate phrases — marketing fluff over substance.`,
    };
  }
  if (hits >= 2) {
    return {
      score: 0.6,
      reason: `${hits} generic phrases detected — leans corporate-fluff.`,
    };
  }
  if (hits === 1) {
    return { score: 0.2, reason: "One generic phrase — borderline." };
  }
  return { score: 0, reason: "No generic corporate fluff detected." };
}

export function assessGhostJob(
  analysis: JobAnalysis,
  jobText: string
): GhostJobAssessment {
  const breakdown: GhostJobBreakdown = {
    vagueDescription: vagueDescriptionScore(jobText),
    noSalary: noSalaryScore(analysis.meta),
    externalRecruiter: externalRecruiterScore(jobText, analysis.meta.company),
    genericCompany: genericCompanyScore(jobText),
  };

  const weighted =
    breakdown.vagueDescription.score * WEIGHTS.vagueDescription +
    breakdown.noSalary.score * WEIGHTS.noSalary +
    breakdown.externalRecruiter.score * WEIGHTS.externalRecruiter +
    breakdown.genericCompany.score * WEIGHTS.genericCompany;

  return {
    score: Math.round(weighted * 100),
    breakdown,
  };
}
