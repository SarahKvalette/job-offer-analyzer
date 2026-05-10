import { describe, it, expect } from "vitest";
import { assessGhostJob } from "./ghost-job";
import type { JobAnalysis } from "@/lib/schemas/analysis";

function makeAnalysis(overrides: Partial<JobAnalysis["meta"]> = {}): JobAnalysis {
  return {
    meta: {
      title: "Senior Backend Engineer",
      company: "Acme Inc.",
      location: "Paris",
      remote: "hybrid",
      contractType: "CDI",
      salaryRange: { min: 60000, max: 75000, currency: "EUR" },
      seniorityAnnounced: "senior",
      ...overrides,
    },
    skills: { required: [], niceToHave: [], impliedButUnstated: [] },
    realityCheck: {
      redFlags: [],
      greenFlags: [],
      seniorityRealVsAnnounced: { real: "senior", reasoning: "ok" },
    },
    questionsToAsk: [],
  };
}

const SUBSTANTIVE_TEXT = `
We're hiring a Senior Backend Engineer to join our payments team.

Stack: TypeScript, Node.js, PostgreSQL, Redis, Kafka, AWS, Kubernetes,
Terraform. Frontend integration via GraphQL. CI on GitHub Actions.

You will:
- Own the API surface of the payment gateway
- Design Postgres schemas and migration strategy
- Implement Redis caching for high-throughput endpoints
- Write Pytest and Vitest tests, contribute to our Cypress E2E suite
- Pair on platform design with the SRE team (Kubernetes, Terraform)

Requirements: 5+ years with TypeScript and Node.js, deep Postgres
knowledge, comfortable with AWS / Docker / Kafka, RESTful and GraphQL.
`.trim();

const VAGUE_TEXT = `
We are a leader du marché à la recherche d'un développeur dynamique.
Vous intégrerez une société à taille humaine avec des valeurs fortes.
Rejoignez notre équipe pour un environnement stimulant.
`.trim();

const RECRUITER_TEXT = `
Hays Recrutement recherche un développeur senior pour un de ses clients.
Compétences requises : Java, Spring Boot, AWS.
Cabinet de recrutement à votre service.
`.trim();

describe("assessGhostJob", () => {
  it("returns a low score on a substantive posting", () => {
    const out = assessGhostJob(makeAnalysis(), SUBSTANTIVE_TEXT);
    expect(out.score).toBeLessThan(50);
    expect(out.breakdown.vagueDescription.score).toBeLessThan(0.5);
    expect(out.breakdown.noSalary.score).toBe(0);
    expect(out.breakdown.externalRecruiter.score).toBe(0);
  });

  it("returns a high score on a vague + no-salary + corporate-fluff posting", () => {
    const noSalary = makeAnalysis({ salaryRange: null });
    const out = assessGhostJob(noSalary, VAGUE_TEXT);
    expect(out.score).toBeGreaterThanOrEqual(50);
    expect(out.breakdown.noSalary.score).toBe(1);
    expect(out.breakdown.genericCompany.score).toBeGreaterThan(0);
    expect(out.breakdown.vagueDescription.score).toBeGreaterThan(0);
  });

  it("flags external staffing agencies by name", () => {
    const noSalary = makeAnalysis({ salaryRange: null, company: "Hays" });
    const out = assessGhostJob(noSalary, RECRUITER_TEXT);
    expect(out.breakdown.externalRecruiter.score).toBe(1);
    expect(out.breakdown.externalRecruiter.reason.toLowerCase()).toContain("hays");
  });

  it("flags generic 'cabinet de recrutement' phrasing", () => {
    const noSalary = makeAnalysis({ salaryRange: null });
    const out = assessGhostJob(
      noSalary,
      "Notre cabinet de recrutement vous propose un poste."
    );
    expect(out.breakdown.externalRecruiter.score).toBeGreaterThan(0);
  });

  it("any 2 critical signals together cross the 50% threshold", () => {
    // No salary + vague text
    const out = assessGhostJob(
      makeAnalysis({ salaryRange: null }),
      "Nous recrutons un profil dynamique pour notre société."
    );
    expect(out.score).toBeGreaterThanOrEqual(50);
  });

  it("returns a score of 0 with disclosed salary + substantive text", () => {
    const out = assessGhostJob(makeAnalysis(), SUBSTANTIVE_TEXT);
    expect(out.score).toBe(0);
  });

  it("breakdown reasons are non-empty", () => {
    const out = assessGhostJob(makeAnalysis(), SUBSTANTIVE_TEXT);
    expect(out.breakdown.vagueDescription.reason.length).toBeGreaterThan(0);
    expect(out.breakdown.noSalary.reason.length).toBeGreaterThan(0);
    expect(out.breakdown.externalRecruiter.reason.length).toBeGreaterThan(0);
    expect(out.breakdown.genericCompany.reason.length).toBeGreaterThan(0);
  });

  it("very short postings always score high on vagueness", () => {
    const out = assessGhostJob(
      makeAnalysis({ salaryRange: null }),
      "Dev senior. Postulez."
    );
    expect(out.breakdown.vagueDescription.score).toBeGreaterThan(0.7);
  });
});
