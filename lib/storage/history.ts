"use client";

import {
  CURRENT_STORAGE_VERSION,
  type StoredAnalysis,
} from "@/lib/schemas/analysis";
import { migrateStoredEntry } from "@/lib/storage/migrate";

const STORAGE_KEY = "joa.history.v1";
const MAX_ENTRIES = 10;
const CHANGE_EVENT = "joa:history-change";

const EMPTY_HISTORY: readonly StoredAnalysis[] = Object.freeze([]);

/**
 * Cached, sorted snapshot of localStorage. The same reference is returned
 * across calls until the underlying data changes, so React 19's
 * `useSyncExternalStore` can rely on `Object.is` to detect updates.
 */
let snapshot: StoredAnalysis[] | null = null;

function invalidateSnapshot(): void {
  snapshot = null;
}

function readAll(): StoredAnalysis[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => migrateStoredEntry(item))
      .filter((entry): entry is StoredAnalysis => entry !== null);
  } catch {
    return [];
  }
}

function writeAll(entries: StoredAnalysis[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  invalidateSnapshot();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Stable, cached snapshot — safe for `useSyncExternalStore`. */
export function getHistorySnapshot(): readonly StoredAnalysis[] {
  if (snapshot === null) {
    snapshot = readAll().sort((a, b) => b.createdAt - a.createdAt);
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
  return getHistorySnapshot().find((entry) => entry.id === id) ?? null;
}

export function saveAnalysis(entry: StoredAnalysis): void {
  const stamped: StoredAnalysis = {
    ...entry,
    schemaVersion: entry.schemaVersion ?? CURRENT_STORAGE_VERSION,
  };
  const filtered = readAll().filter((existing) => existing.id !== stamped.id);
  const next = [stamped, ...filtered]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ENTRIES);
  writeAll(next);
}

export function deleteAnalysis(id: string): void {
  const next = readAll().filter((entry) => entry.id !== id);
  writeAll(next);
}

export function subscribeToHistory(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  // External storage events (e.g. other tabs writing the same key) may bypass
  // our writeAll() invalidation, so refresh the cache on every notification.
  const handler = () => {
    invalidateSnapshot();
    listener();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function newAnalysisId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
