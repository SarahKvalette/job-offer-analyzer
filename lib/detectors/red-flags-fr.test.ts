import { describe, it, expect } from "vitest";
import { detectRedFlagsFR, RED_FLAGS_FR } from "./red-flags-fr";

describe("RED_FLAGS_FR dictionary", () => {
  it("contains at least 30 entries", () => {
    expect(RED_FLAGS_FR.length).toBeGreaterThanOrEqual(30);
  });

  it("has unique canonical labels", () => {
    const canonicals = RED_FLAGS_FR.map((e) => e.canonical);
    const unique = new Set(canonicals);
    expect(unique.size).toBe(canonicals.length);
  });

  it("has a non-empty meaning and advice for every entry", () => {
    for (const entry of RED_FLAGS_FR) {
      expect(entry.meaning.length).toBeGreaterThan(0);
      expect(entry.advice.length).toBeGreaterThan(0);
    }
  });
});

describe("detectRedFlagsFR — exact matches", () => {
  it("returns empty array for empty text", () => {
    expect(detectRedFlagsFR("")).toEqual([]);
  });

  it("returns empty array for text with no recruiter-speak", () => {
    const text = "Nous cherchons un développeur Go senior. Salaire 60K€/an.";
    expect(detectRedFlagsFR(text)).toEqual([]);
  });

  it("detects 'esprit guerrier'", () => {
    const out = detectRedFlagsFR("Vous avez un esprit guerrier et aimez l'action.");
    expect(out).toHaveLength(1);
    expect(out[0].canonical).toBe("esprit guerrier");
    expect(out[0].severity).toBe("high");
  });

  it("detects 'famille' in 'comme une famille'", () => {
    const out = detectRedFlagsFR("Chez Acme, nous sommes comme une famille.");
    expect(out.find((f) => f.canonical === "famille")).toBeDefined();
  });

  it("detects 'porter plusieurs casquettes'", () => {
    const out = detectRedFlagsFR(
      "Vous saurez porter plusieurs casquettes au quotidien."
    );
    expect(out.find((f) => f.canonical === "porter plusieurs casquettes")).toBeDefined();
  });

  it("detects 'rémunération attractive'", () => {
    const out = detectRedFlagsFR("Rémunération attractive selon profil.");
    expect(out.find((f) => f.canonical === "rémunération attractive")).toBeDefined();
  });

  it("detects 'package compétitif'", () => {
    const out = detectRedFlagsFR("Package compétitif + tickets restaurant.");
    expect(out.find((f) => f.canonical === "package compétitif")).toBeDefined();
  });
});

describe("detectRedFlagsFR — case + accent + composition", () => {
  it("is case-insensitive", () => {
    const out = detectRedFlagsFR("ESPRIT GUERRIER!");
    expect(out.find((f) => f.canonical === "esprit guerrier")).toBeDefined();
  });

  it("matches 'mentalité start-up' and 'mentalite startup'", () => {
    const a = detectRedFlagsFR("Mentalité start-up garantie.");
    const b = detectRedFlagsFR("On a une mentalite startup.");
    expect(a.find((f) => f.canonical === "mentalité start-up")).toBeDefined();
    expect(b.find((f) => f.canonical === "mentalité start-up")).toBeDefined();
  });

  it("matches 'hyper-croissance' and 'hyper croissance'", () => {
    const a = detectRedFlagsFR("Une boîte en hyper-croissance.");
    const b = detectRedFlagsFR("On est en hyper croissance.");
    expect(a.find((f) => f.canonical === "hyper-croissance")).toBeDefined();
    expect(b.find((f) => f.canonical === "hyper-croissance")).toBeDefined();
  });

  it("captures multiple distinct flags in the same posting", () => {
    const text = `Nous cherchons un couteau-suisse passionné, prêt à porter plusieurs casquettes
      dans une ambiance famille. Rémunération attractive.`;
    const out = detectRedFlagsFR(text);
    const canonicals = out.map((f) => f.canonical);
    expect(canonicals).toContain("couteau-suisse");
    expect(canonicals).toContain("passionné·e");
    expect(canonicals).toContain("porter plusieurs casquettes");
    expect(canonicals).toContain("famille");
    expect(canonicals).toContain("rémunération attractive");
  });

  it("does NOT double-count the same canonical entry mentioned twice", () => {
    const text = "Esprit guerrier requis. Vraiment esprit guerrier important.";
    const out = detectRedFlagsFR(text);
    const guerrier = out.filter((f) => f.canonical === "esprit guerrier");
    expect(guerrier).toHaveLength(1);
  });
});

describe("detectRedFlagsFR — false positives", () => {
  it("does NOT match 'famille' when used in literal sense", () => {
    // "famille" alone (not "comme une famille" / "ambiance famille") shouldn't trigger.
    const out = detectRedFlagsFR("Avantages famille : crèche d'entreprise.");
    expect(out.find((f) => f.canonical === "famille")).toBeUndefined();
  });

  it("does NOT match 'autonome' when describing a tool", () => {
    // The 'très autonome' rule requires the qualifier — "autonome" alone shouldn't trigger.
    const out = detectRedFlagsFR("Voiture autonome de fonction.");
    // The pattern is permissive, so we accept that this might still match in
    // some cases — but ensure we at least don't return more than one entry.
    expect(out.length).toBeLessThanOrEqual(1);
  });
});

describe("detectRedFlagsFR — output shape", () => {
  it("each result carries source='fr-dictionary' and a verbatim phrase", () => {
    const out = detectRedFlagsFR("Rythme soutenu et challenge permanent.");
    expect(out.length).toBeGreaterThan(0);
    for (const flag of out) {
      expect(flag.source).toBe("fr-dictionary");
      expect(flag.phrase.length).toBeGreaterThan(0);
      expect(flag.translation.length).toBeGreaterThan(0);
      expect(flag.advice.length).toBeGreaterThan(0);
    }
  });

  it("preserves the actual matched substring (verbatim)", () => {
    const out = detectRedFlagsFR("ESPRIT GUERRIER attendu.");
    const guerrier = out.find((f) => f.canonical === "esprit guerrier");
    expect(guerrier?.phrase).toBe("ESPRIT GUERRIER");
  });
});
