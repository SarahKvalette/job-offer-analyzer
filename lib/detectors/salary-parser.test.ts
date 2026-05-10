import { describe, it, expect } from "vitest";
import { parseSalaryRange } from "./salary-parser";

describe("parseSalaryRange — common FR formats", () => {
  it("parses 45-55K€", () => {
    const out = parseSalaryRange("Salaire 45-55K€ selon profil.");
    expect(out).not.toBeNull();
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(55_000);
    expect(out!.currency).toBe("EUR");
    expect(out!.period).toBe("year");
  });

  it("parses 45 000€ à 55 000€", () => {
    const out = parseSalaryRange("Entre 45 000€ à 55 000€ par an.");
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(55_000);
    expect(out!.currency).toBe("EUR");
  });

  it("parses 45-55 K€/an", () => {
    const out = parseSalaryRange("45-55 K€/an, brut.");
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(55_000);
    expect(out!.period).toBe("year");
  });

  it("parses 'entre 45 et 55K€'", () => {
    const out = parseSalaryRange("Rémunération entre 45 et 55K€ brut annuel.");
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(55_000);
  });

  it("parses 45 000 à 55 000 EUR brut/an", () => {
    const out = parseSalaryRange("De 45 000 à 55 000 EUR brut/an.");
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(55_000);
    expect(out!.currency).toBe("EUR");
  });

  it("parses french hyphen variants 45–55K€ (en-dash)", () => {
    const out = parseSalaryRange("Salaire 45–55K€ selon expérience.");
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(55_000);
  });
});

describe("parseSalaryRange — common EN formats", () => {
  it("parses €55,000 to €70,000 per year", () => {
    const out = parseSalaryRange("Compensation €55,000 to €70,000 per year.");
    expect(out!.min).toBe(55_000);
    expect(out!.max).toBe(70_000);
    expect(out!.currency).toBe("EUR");
  });

  it("parses $90k to $120k", () => {
    const out = parseSalaryRange("Salary $90k to $120k base.");
    expect(out!.min).toBe(90_000);
    expect(out!.max).toBe(120_000);
    expect(out!.currency).toBe("USD");
  });

  it("parses £45,000 - £60,000", () => {
    const out = parseSalaryRange("£45,000 - £60,000 per year.");
    expect(out!.min).toBe(45_000);
    expect(out!.max).toBe(60_000);
    expect(out!.currency).toBe("GBP");
  });
});

describe("parseSalaryRange — period detection", () => {
  it("detects monthly", () => {
    const out = parseSalaryRange("3 500 à 4 500€ par mois.");
    expect(out!.period).toBe("month");
    expect(out!.min).toBe(3_500);
  });

  it("detects daily (TJM)", () => {
    const out = parseSalaryRange("TJM 600-800€");
    expect(out!.period).toBe("day");
    expect(out!.min).toBe(600);
  });

  it("defaults to yearly when period is implicit", () => {
    const out = parseSalaryRange("45-55K€");
    expect(out!.period).toBe("year");
  });
});

describe("parseSalaryRange — robustness", () => {
  it("returns null for empty text", () => {
    expect(parseSalaryRange("")).toBeNull();
  });

  it("returns null when no currency is mentioned", () => {
    expect(parseSalaryRange("Between 45 and 55, contact us.")).toBeNull();
  });

  it("returns null when range is implausibly wide", () => {
    // 1k–500k year range: ratio 500 → too wide, false positive guard
    expect(parseSalaryRange("From 10€ to 200K€ per year.")).toBeNull();
  });

  it("returns null when numbers look like years", () => {
    // 2020-2024 should not be a salary
    expect(parseSalaryRange("Active 2020-2024 € fund.")).toBeNull();
  });

  it("does not pick up postal codes or contract IDs", () => {
    expect(parseSalaryRange("Code postal 75001-75020. Pas de salaire.")).toBeNull();
  });
});
