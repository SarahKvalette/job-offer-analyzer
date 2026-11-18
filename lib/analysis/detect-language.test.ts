import { describe, it, expect } from "vitest";
import { detectLanguage } from "./detect-language";

describe("detectLanguage", () => {
  it("detects a French posting", () => {
    const fr =
      "Nous recherchons un Product Designer confirmé pour rejoindre notre équipe produit. Vous mènerez la discovery et concevrez des parcours dans Figma. Expérience de 4 ans minimum.";
    expect(detectLanguage(fr)).toBe("fr");
  });

  it("detects an English posting", () => {
    const en =
      "We are looking for a Senior Product Designer to join our team. You will lead discovery and design end-to-end flows in Figma. Requirements: 4 years of experience.";
    expect(detectLanguage(en)).toBe("en");
  });

  it("defaults to French on empty input", () => {
    expect(detectLanguage("")).toBe("fr");
    expect(detectLanguage("   ")).toBe("fr");
  });

  it("uses accents to break near-ties toward French", () => {
    expect(detectLanguage("Développeur expérimenté, démarrage immédiat")).toBe(
      "fr"
    );
  });
});
