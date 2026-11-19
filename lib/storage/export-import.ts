import { migrateStoredEntry } from "@/lib/storage/migrate";
import type { StoredAnalysis } from "@/lib/schemas/analysis";

/**
 * Versioned export / import of the full analysis history.
 *
 * The export is a self-describing, versioned JSON envelope so a future import
 * can recognise and migrate it. Import re-validates every entry through
 * `migrateStoredEntry` (the same path used when reading from IndexedDB), so a
 * tampered or stale file can't corrupt the store — unknown entries are
 * dropped, not trusted.
 */
export const EXPORT_APP = "job-offer-analyzer";
export const EXPORT_TYPE = "joa-export";
export const EXPORT_FORMAT_VERSION = 1;

export type AnalysesExport = {
  app: typeof EXPORT_APP;
  type: typeof EXPORT_TYPE;
  formatVersion: number;
  exportedAt: number;
  count: number;
  analyses: StoredAnalysis[];
};

export function buildAnalysesExport(
  entries: readonly StoredAnalysis[]
): AnalysesExport {
  return {
    app: EXPORT_APP,
    type: EXPORT_TYPE,
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: Date.now(),
    count: entries.length,
    analyses: [...entries],
  };
}

export function exportToJsonString(entries: readonly StoredAnalysis[]): string {
  return JSON.stringify(buildAnalysesExport(entries), null, 2);
}

/** Error codes mapped to French messages in the UI (t.profile.sections.data). */
export type ImportErrorCode = "unreadable" | "wrong_type" | "empty";

export type ImportResult =
  | { ok: true; entries: StoredAnalysis[]; dropped: number }
  | { ok: false; code: ImportErrorCode };

export function parseAnalysesImport(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, code: "unreadable" };
  }

  if (
    !data ||
    typeof data !== "object" ||
    (data as { type?: unknown }).type !== EXPORT_TYPE ||
    !Array.isArray((data as { analyses?: unknown }).analyses)
  ) {
    return { ok: false, code: "wrong_type" };
  }

  const raw = (data as { analyses: unknown[] }).analyses;
  const entries: StoredAnalysis[] = [];
  for (const item of raw) {
    const migrated = migrateStoredEntry(item);
    if (migrated) entries.push(migrated);
  }

  if (entries.length === 0) {
    return { ok: false, code: "empty" };
  }

  return { ok: true, entries, dropped: raw.length - entries.length };
}
