import { describe, it, expect } from "vitest";
import {
  compareSalary,
  findBenchmark,
  normaliseLevel,
  normaliseLocation,
} from "./salary-benchmark";

describe("findBenchmark", () => {
  it("returns an entry for known role/level/location", () => {
    const entry = findBenchmark("backend", "senior", "paris");
    expect(entry).not.toBeNull();
    expect(entry!.median).toBeGreaterThan(50_000);
    expect(entry!.min).toBeLessThan(entry!.max);
  });

  it("returns null for unknown combinations", () => {
    expect(findBenchmark("mobile", "staff", "paris")).toBeNull();
    expect(findBenchmark("data", "staff", "lyon")).toBeNull();
  });

  it("min ≤ median ≤ max for every entry", () => {
    const roles: Array<Parameters<typeof findBenchmark>[0]> = [
      "frontend",
      "backend",
      "fullstack",
      "data",
      "devops",
      "mobile",
    ];
    for (const role of roles) {
      for (const level of ["junior", "mid", "senior", "staff"] as const) {
        for (const loc of ["paris", "lyon", "remote-eu"] as const) {
          const e = findBenchmark(role, level, loc);
          if (!e) continue;
          expect(e.min).toBeLessThanOrEqual(e.median);
          expect(e.median).toBeLessThanOrEqual(e.max);
        }
      }
    }
  });
});

describe("normaliseLocation", () => {
  it("maps Paris and IDF aliases", () => {
    expect(normaliseLocation("Paris")).toBe("paris");
    expect(normaliseLocation("Île-de-France")).toBe("paris");
    expect(normaliseLocation("Paris 9e")).toBe("paris");
  });

  it("maps remote variants to remote-eu", () => {
    expect(normaliseLocation("Remote")).toBe("remote-eu");
    expect(normaliseLocation("Full remote")).toBe("remote-eu");
    expect(normaliseLocation("Télétravail intégral")).toBe("remote-eu");
  });

  it("returns null for unknown locations", () => {
    expect(normaliseLocation("Marseille")).toBeNull();
    expect(normaliseLocation("Hamburg")).toBeNull();
  });

  it("returns null for empty / null input", () => {
    expect(normaliseLocation(null)).toBeNull();
    expect(normaliseLocation("")).toBeNull();
  });
});

describe("normaliseLevel", () => {
  it("passes through known levels", () => {
    expect(normaliseLevel("junior")).toBe("junior");
    expect(normaliseLevel("senior")).toBe("senior");
    expect(normaliseLevel("staff")).toBe("staff");
  });

  it("returns null for unknown", () => {
    expect(normaliseLevel("unknown")).toBeNull();
  });
});

describe("compareSalary", () => {
  const benchmark = findBenchmark("backend", "senior", "paris")!;

  it("classifies a salary at parity", () => {
    const declared = {
      min: benchmark.median - 2_000,
      max: benchmark.median + 2_000,
      currency: "EUR",
      period: "year",
    };
    const out = compareSalary(declared, benchmark);
    expect(out!.position).toBe("parity");
    expect(Math.abs(out!.deltaPercent)).toBeLessThan(15);
  });

  it("classifies a salary clearly below market", () => {
    const declared = {
      min: 40_000,
      max: 50_000,
      currency: "EUR",
      period: "year",
    };
    const out = compareSalary(declared, benchmark);
    expect(out!.position).toBe("below");
    expect(out!.deltaPercent).toBeLessThan(-15);
  });

  it("classifies a salary clearly above market", () => {
    const declared = {
      min: 100_000,
      max: 130_000,
      currency: "EUR",
      period: "year",
    };
    const out = compareSalary(declared, benchmark);
    expect(out!.position).toBe("above");
    expect(out!.deltaPercent).toBeGreaterThan(15);
  });

  it("returns null on currency mismatch", () => {
    const declared = {
      min: 80_000,
      max: 90_000,
      currency: "USD",
      period: "year",
    };
    expect(compareSalary(declared, benchmark)).toBeNull();
  });

  it("returns null on period mismatch", () => {
    const declared = {
      min: 5_000,
      max: 6_500,
      currency: "EUR",
      period: "month",
    };
    expect(compareSalary(declared, benchmark)).toBeNull();
  });
});
