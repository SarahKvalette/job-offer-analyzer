"use client";

import Dexie, { type Table } from "dexie";
import {
  CURRENT_STORAGE_VERSION,
  type StoredAnalysis,
} from "@/lib/schemas/analysis";
import { migrateStoredEntry } from "@/lib/storage/migrate";

/**
 * Analysis history repository.
 *
 * The single place that touches persistence — no component reaches into
 * IndexedDB (or the old localStorage) directly. Persistence lives in
 * IndexedDB via Dexie (v3); the previous localStorage blob is imported once
 * and then left alone as a backup.
 *
 * The public read API stays **synchronous** (so React 19's
 * `useSyncExternalStore` keeps working) by serving an in-memory cache. That
 * cache is hydrated from IndexedDB asynchronously on first use; writes update
 * the cache immediately and write through to IndexedDB in the background.
 */

const DB_NAME = "joa";
const CHANGE_EVENT = "joa:history-change";
const LEGACY_LS_KEY = "joa.history.v1";
const MIGRATION_FLAG = "joa.history.migratedToIdb";

const EMPTY_HISTORY: readonly StoredAnalysis[] = Object.freeze([]);

// ── Dexie database ────────────────────────────────────────────────────

class JoaDatabase extends Dexie {
  analyses!: Table<StoredAnalysis, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      // Primary key `id`; `createdAt` indexed for ordered reads.
      analyses: "id, createdAt",
    });
  }
}

let db: JoaDatabase | null = null;

function getDb(): JoaDatabase | null {
  if (typeof window === "undefined") return null;
  if (typeof indexedDB === "undefined") return null;
  if (!db) db = new JoaDatabase();
  return db;
}

// ── In-memory cache (source of truth for synchronous reads) ───────────

let cache: StoredAnalysis[] = []; // kept sorted, newest first
let snapshot: readonly StoredAnalysis[] | null = null;

function invalidateSnapshot(): void {
  snapshot = null;
}

function sortDesc(entries: StoredAnalysis[]): StoredAnalysis[] {
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

function setCache(next: StoredAnalysis[]): void {
  cache = sortDesc(next);
  invalidateSnapshot();
  notifyChange();
}

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

// ── Hydration + one-time localStorage → IndexedDB migration ───────────

let hydrated = false;
let hydrating: Promise<void> | null = null;

async function importLegacyLocalStorage(database: JoaDatabase): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MIGRATION_FLAG)) return;
    const raw = window.localStorage.getItem(LEGACY_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const entries = parsed
          .map((item) => migrateStoredEntry(item))
          .filter((e): e is StoredAnalysis => e !== null);
        if (entries.length > 0) await database.analyses.bulkPut(entries);
      }
    }
    // Mark done even when there was nothing to import, so we don't retry.
    // The legacy blob is intentionally kept as a backup (not removed).
    window.localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    // Corrupt blob or storage error — skip; IndexedDB stays the source.
  }
}

/**
 * Load all entries from IndexedDB into the in-memory cache. Safe to call
 * repeatedly — only the first call does work. Components don't need to await
 * this; the cache fills and a change event re-renders subscribers.
 */
export function hydrateHistory(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;

  const database = getDb();
  if (!database) {
    hydrated = true;
    return Promise.resolve();
  }

  hydrating = (async () => {
    await importLegacyLocalStorage(database);
    const rows = await database.analyses.toArray();
    const entries = rows
      .map((item) => migrateStoredEntry(item))
      .filter((e): e is StoredAnalysis => e !== null);
    cache = sortDesc(entries);
    hydrated = true;
    invalidateSnapshot();
    // Defer to a macrotask so subscribers' setState never lands inside a React
    // render pass (hydration resolves as a microtask during concurrent render).
    if (typeof window !== "undefined") setTimeout(notifyChange, 0);
    else notifyChange();
  })()
    .catch(() => {
      hydrated = true;
    })
    .finally(() => {
      hydrating = null;
    });

  return hydrating;
}

// ── Public read API ───────────────────────────────────────────────────

/** Stable, cached snapshot — safe for `useSyncExternalStore`. */
export function getHistorySnapshot(): readonly StoredAnalysis[] {
  // Kick off hydration lazily the first time the store is read on the client.
  if (!hydrated && typeof window !== "undefined") void hydrateHistory();
  if (snapshot === null) {
    snapshot = cache.length > 0 ? Object.freeze([...cache]) : EMPTY_HISTORY;
  }
  return snapshot;
}

/** Snapshot for SSR / hydration. Always the same frozen empty array. */
export function getHistoryServerSnapshot(): readonly StoredAnalysis[] {
  return EMPTY_HISTORY;
}

/** Convenience for one-off reads. */
export function getHistory(): readonly StoredAnalysis[] {
  return getHistorySnapshot();
}

export function getById(id: string): StoredAnalysis | null {
  return cache.find((entry) => entry.id === id) ?? null;
}

// ── Public write API (cache-first, write-through to IndexedDB) ─────────

function stampEntry(entry: StoredAnalysis): StoredAnalysis {
  const now = Date.now();
  return {
    ...entry,
    schemaVersion: entry.schemaVersion ?? CURRENT_STORAGE_VERSION,
    updatedAt: entry.updatedAt ?? now,
    application: entry.application ?? {
      status: "interested",
      appliedAt: null,
      lastInteractionAt: entry.createdAt,
      notes: "",
      tags: [],
      contacts: [],
      nextAction: null,
      followUpDate: null,
      closedReason: "",
    },
  };
}

export function saveAnalysis(entry: StoredAnalysis): void {
  const stamped = stampEntry(entry);
  setCache([stamped, ...cache.filter((existing) => existing.id !== stamped.id)]);
  const database = getDb();
  if (database) void database.analyses.put(stamped).catch(() => {});
}

export function deleteAnalysis(id: string): void {
  setCache(cache.filter((entry) => entry.id !== id));
  const database = getDb();
  if (database) void database.analyses.delete(id).catch(() => {});
}

/**
 * Patch the application sub-object on an existing entry. Ignores the call
 * when the id isn't found. Bumps `lastInteractionAt` (and `updatedAt`) to now
 * so the reminders heuristic stays accurate.
 */
export function updateApplication(
  id: string,
  patch: Partial<NonNullable<StoredAnalysis["application"]>>
): void {
  const idx = cache.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const entry = cache[idx];
  const current = entry.application ?? {
    status: "interested" as const,
    appliedAt: null,
    lastInteractionAt: entry.createdAt,
    notes: "",
    tags: [],
    contacts: [],
    nextAction: null,
    followUpDate: null,
    closedReason: "",
  };
  const updated: StoredAnalysis = {
    ...entry,
    updatedAt: Date.now(),
    application: {
      ...current,
      ...patch,
      lastInteractionAt: Date.now(),
    },
  };
  const next = [...cache];
  next[idx] = updated;
  setCache(next);
  const database = getDb();
  if (database) void database.analyses.put(updated).catch(() => {});
}

export function subscribeToHistory(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  // Ensure data is loading as soon as something subscribes (on mount).
  if (!hydrated) void hydrateHistory();
  const handler = () => {
    invalidateSnapshot();
    listener();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

export function newAnalysisId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Test-only: drop the in-memory cache and re-arm hydration. */
export function __resetHistoryForTests(): void {
  if (db) db.close();
  cache = [];
  snapshot = null;
  hydrated = false;
  hydrating = null;
  db = null;
}
