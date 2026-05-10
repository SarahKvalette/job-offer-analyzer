import { describe, it, expect } from "vitest";
import { migrateStoredEntry } from "./migrate";
import { CURRENT_STORAGE_VERSION } from "@/lib/schemas/analysis";

const VALID_ANALYSIS = {
  meta: {
    title: "Senior Backend Engineer",
    company: "Acme",
    location: "Paris",
    remote: "hybrid",
    contractType: "CDI",
    salaryRange: { min: 50000, max: 70000, currency: "EUR" },
    seniorityAnnounced: "senior",
  },
  skills: { required: [], niceToHave: [], impliedButUnstated: [] },
  realityCheck: {
    redFlags: [],
    greenFlags: [],
    seniorityRealVsAnnounced: { real: "senior", reasoning: "ok" },
  },
  questionsToAsk: [],
};

const LEGACY_ENTRY = {
  id: "abc",
  createdAt: 1_700_000_000_000,
  jobText: "raw text",
  analysis: VALID_ANALYSIS,
};

describe("migrateStoredEntry", () => {
  it("stamps schemaVersion on a legacy entry without one", () => {
    const out = migrateStoredEntry(LEGACY_ENTRY);
    expect(out).not.toBeNull();
    expect(out?.schemaVersion).toBe(CURRENT_STORAGE_VERSION);
  });

  it("preserves an entry that already has the current schemaVersion", () => {
    const stamped = { ...LEGACY_ENTRY, schemaVersion: CURRENT_STORAGE_VERSION };
    const out = migrateStoredEntry(stamped);
    expect(out?.schemaVersion).toBe(CURRENT_STORAGE_VERSION);
    expect(out?.id).toBe(stamped.id);
  });

  it("upgrades schemaVersion when input is older than current", () => {
    const stale = { ...LEGACY_ENTRY, schemaVersion: 0 };
    const out = migrateStoredEntry(stale);
    expect(out?.schemaVersion).toBe(CURRENT_STORAGE_VERSION);
  });

  it("returns null for structurally invalid entries", () => {
    expect(migrateStoredEntry({ id: "bad" })).toBeNull();
    expect(migrateStoredEntry(null)).toBeNull();
    expect(migrateStoredEntry("string")).toBeNull();
  });

  it("preserves analysis content unchanged through migration", () => {
    const out = migrateStoredEntry(LEGACY_ENTRY);
    expect(out?.analysis.meta.title).toBe(VALID_ANALYSIS.meta.title);
    expect(out?.jobText).toBe(LEGACY_ENTRY.jobText);
  });
});
