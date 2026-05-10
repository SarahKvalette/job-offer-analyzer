import { z } from "zod";

/**
 * Local-only user profile, stored in `joa.profile.v1` localStorage.
 *
 * Bumped via `CURRENT_PROFILE_VERSION` whenever the shape gains a required
 * field. New optional fields don't require a bump (see `verdict` precedent
 * on the analysis schema).
 */
export const CURRENT_PROFILE_VERSION = 1;

const currencyEnum = z.enum(["EUR", "USD", "GBP"]);
const periodEnum = z.enum(["year", "month", "day"]);
const remotePreferenceEnum = z.enum(["full", "hybrid", "onsite", "any"]);

const minSalarySchema = z
  .object({
    amount: z.number().min(0),
    currency: currencyEnum,
    period: periodEnum,
  })
  .nullable();

/**
 * Six dimensions, each a 0-100 raw weight. Stored unnormalised; we
 * normalise to a 1-sum vector at use time so the user can crank "salary"
 * to 100 without having to drop everything else.
 */
const weightsSchema = z.object({
  salary: z.number().min(0).max(100),
  remote: z.number().min(0).max(100),
  stack: z.number().min(0).max(100),
  growth: z.number().min(0).max(100),
  balance: z.number().min(0).max(100),
  culture: z.number().min(0).max(100),
});

export const userProfileSchema = z.object({
  schemaVersion: z.number().optional(),
  /**
   * Stack ids from the predefined dataset, e.g. "frontend:react".
   * Custom additions are stored as "custom:Whatever Label".
   */
  stack: z.array(z.string()).default([]),
  yearsExperience: z.number().min(0).max(60).default(0),
  minSalary: minSalarySchema.default(null),
  remotePreference: remotePreferenceEnum.default("any"),
  location: z.string().default(""),
  acceptedZones: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  dealBreakers: z.array(z.string()).default([]),
  weights: weightsSchema.default({
    salary: 50,
    remote: 50,
    stack: 50,
    growth: 50,
    balance: 50,
    culture: 50,
  }),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type ProfileWeights = UserProfile["weights"];

export const DEFAULT_PROFILE: UserProfile = {
  schemaVersion: CURRENT_PROFILE_VERSION,
  stack: [],
  yearsExperience: 0,
  minSalary: null,
  remotePreference: "any",
  location: "",
  acceptedZones: [],
  languages: [],
  dealBreakers: [],
  weights: {
    salary: 50,
    remote: 50,
    stack: 50,
    growth: 50,
    balance: 50,
    culture: 50,
  },
};

/**
 * `true` when no fields have been customised (used by the UI to show an
 * empty state and to short-circuit fit-score computation).
 */
export function isProfileEmpty(profile: UserProfile): boolean {
  return (
    profile.stack.length === 0 &&
    profile.yearsExperience === 0 &&
    profile.minSalary === null &&
    profile.remotePreference === "any" &&
    profile.location === "" &&
    profile.acceptedZones.length === 0 &&
    profile.languages.length === 0 &&
    profile.dealBreakers.length === 0
  );
}
