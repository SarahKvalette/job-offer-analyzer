import {
  CURRENT_STORAGE_VERSION,
  storedAnalysisSchema,
  type StoredAnalysis,
} from "@/lib/schemas/analysis";

/**
 * Upgrade a localStorage entry of any earlier shape to the current
 * `StoredAnalysis` shape.
 *
 * Strategy:
 * - If the input doesn't even parse as a structurally compatible entry, return
 *   `null` (caller drops it silently).
 * - Otherwise stamp `schemaVersion` to the current version. Future field
 *   migrations should be added as small `if (v < N) { … }` steps below.
 *
 * Why this exists: Phase 1 will add user-profile snapshots, fit scores, and
 * application status to stored entries. Without versioning, legacy entries
 * would silently fail Zod validation and disappear from the user's history.
 */
export function migrateStoredEntry(raw: unknown): StoredAnalysis | null {
  const parsed = storedAnalysisSchema.safeParse(raw);
  if (!parsed.success) return null;

  const entry = parsed.data;
  let version = entry.schemaVersion ?? 0;

  // v0 → v1 : ensure schemaVersion is stamped. Optional `verdict` and
  // `company` fields shipped before versioning was introduced — they remain
  // optional, so no migration of nested shape is required here.
  if (version < 1) {
    version = 1;
  }

  // v1 → v2 : add the CRM `application` object (status / notes / tags /
  // contacts / nextAction). Default status is "interested" and the
  // last-interaction timestamp is the entry's createdAt.
  let next = entry;
  if (version < 2) {
    if (!next.application) {
      next = {
        ...next,
        application: {
          status: "interested",
          appliedAt: null,
          lastInteractionAt: next.createdAt,
          notes: "",
          tags: [],
          contacts: [],
          nextAction: null,
        },
      };
    }
    version = 2;
  }

  return {
    ...next,
    schemaVersion: Math.max(version, CURRENT_STORAGE_VERSION),
  };
}
