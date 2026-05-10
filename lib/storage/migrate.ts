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

  // Future migrations:
  // if (version < 2) { … add userProfileSnapshot default … version = 2; }
  // if (version < 3) { … add applicationStatus default … version = 3; }

  return {
    ...entry,
    schemaVersion: Math.max(version, CURRENT_STORAGE_VERSION),
  };
}
