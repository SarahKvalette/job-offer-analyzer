"use client";

import {
  CURRENT_STORAGE_VERSION,
  type StoredAnalysis,
} from "@/lib/schemas/analysis";
import { migrateStoredEntry } from "@/lib/storage/migrate";

const STORAGE_KEY = "joa.history.v1";
const MAX_ENTRIES = 10;
const CHANGE_EVENT = "joa:history-change";

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
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getHistory(): StoredAnalysis[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getById(id: string): StoredAnalysis | null {
  return readAll().find((entry) => entry.id === id) ?? null;
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
  const handler = () => listener();
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
