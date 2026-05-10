import { describe, it, expect } from "vitest";
import {
  CURRENT_PROFILE_VERSION,
  DEFAULT_PROFILE,
  isProfileEmpty,
  userProfileSchema,
} from "./profile";

describe("userProfileSchema", () => {
  it("accepts the default profile", () => {
    const out = userProfileSchema.safeParse(DEFAULT_PROFILE);
    expect(out.success).toBe(true);
  });

  it("fills in defaults for a partial input", () => {
    const out = userProfileSchema.safeParse({});
    expect(out.success).toBe(true);
    if (out.success) {
      expect(out.data.stack).toEqual([]);
      expect(out.data.remotePreference).toBe("any");
      expect(out.data.weights.salary).toBe(50);
    }
  });

  it("rejects invalid currency", () => {
    const out = userProfileSchema.safeParse({
      minSalary: { amount: 50000, currency: "JPY", period: "year" },
    });
    expect(out.success).toBe(false);
  });

  it("rejects out-of-range weights", () => {
    const out = userProfileSchema.safeParse({
      weights: {
        salary: 150,
        remote: 50,
        stack: 50,
        growth: 50,
        balance: 50,
        culture: 50,
      },
    });
    expect(out.success).toBe(false);
  });

  it("rejects negative experience", () => {
    const out = userProfileSchema.safeParse({ yearsExperience: -1 });
    expect(out.success).toBe(false);
  });

  it("accepts a fully customised profile", () => {
    const profile = {
      stack: ["frontend:react", "backend:node"],
      yearsExperience: 7,
      minSalary: { amount: 60000, currency: "EUR", period: "year" },
      remotePreference: "full",
      location: "Paris",
      acceptedZones: ["Île-de-France", "Remote-EU"],
      languages: ["fr", "en"],
      dealBreakers: ["No on-call rotation", "No 100% legacy stack"],
      weights: {
        salary: 90,
        remote: 80,
        stack: 70,
        growth: 60,
        balance: 50,
        culture: 40,
      },
    };
    const out = userProfileSchema.safeParse(profile);
    expect(out.success).toBe(true);
  });
});

describe("isProfileEmpty", () => {
  it("returns true for the default profile", () => {
    expect(isProfileEmpty(DEFAULT_PROFILE)).toBe(true);
  });

  it("returns false when stack has entries", () => {
    expect(
      isProfileEmpty({ ...DEFAULT_PROFILE, stack: ["frontend:react"] })
    ).toBe(false);
  });

  it("returns false when minSalary is set", () => {
    expect(
      isProfileEmpty({
        ...DEFAULT_PROFILE,
        minSalary: { amount: 50000, currency: "EUR", period: "year" },
      })
    ).toBe(false);
  });

  it("returns false when remotePreference is not 'any'", () => {
    expect(
      isProfileEmpty({ ...DEFAULT_PROFILE, remotePreference: "full" })
    ).toBe(false);
  });

  it("ignores weights — they don't count as customised state alone", () => {
    // Weights default to 50 but a user could nudge them without otherwise
    // filling the form. We don't want that to flip the empty state.
    expect(
      isProfileEmpty({
        ...DEFAULT_PROFILE,
        weights: {
          salary: 100,
          remote: 100,
          stack: 100,
          growth: 100,
          balance: 100,
          culture: 100,
        },
      })
    ).toBe(true);
  });
});

describe("CURRENT_PROFILE_VERSION", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(CURRENT_PROFILE_VERSION)).toBe(true);
    expect(CURRENT_PROFILE_VERSION).toBeGreaterThan(0);
  });
});
