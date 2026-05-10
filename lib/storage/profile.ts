"use client";

import {
  CURRENT_PROFILE_VERSION,
  DEFAULT_PROFILE,
  userProfileSchema,
  type UserProfile,
} from "@/lib/schemas/profile";

const STORAGE_KEY = "joa.profile.v1";
const CHANGE_EVENT = "joa:profile-change";

/**
 * Cached snapshot, kept stable across calls so React 19's
 * `useSyncExternalStore` can rely on `Object.is` to detect mutations.
 */
let snapshot: UserProfile | null = null;

function invalidateSnapshot(): void {
  snapshot = null;
}

function readRaw(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_PROFILE;
  try {
    const parsed = JSON.parse(raw);
    const result = userProfileSchema.safeParse(parsed);
    if (!result.success) return DEFAULT_PROFILE;
    return migrateProfile(result.data);
  } catch {
    return DEFAULT_PROFILE;
  }
}

/**
 * Forward-compatible migration. New required fields land here as
 * `if (version < N) { … }` steps, just like StoredAnalysis.
 */
function migrateProfile(profile: UserProfile): UserProfile {
  const v = profile.schemaVersion ?? 0;
  if (v >= CURRENT_PROFILE_VERSION) return profile;

  // v0 → v1: stamp version on legacy entries (no shape change yet).
  return {
    ...profile,
    schemaVersion: CURRENT_PROFILE_VERSION,
  };
}

function writeAll(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  const stamped: UserProfile = {
    ...profile,
    schemaVersion: CURRENT_PROFILE_VERSION,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  invalidateSnapshot();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Stable, cached snapshot — safe for `useSyncExternalStore`. */
export function getProfileSnapshot(): UserProfile {
  if (snapshot === null) {
    snapshot = readRaw();
  }
  return snapshot;
}

/** Snapshot for SSR / hydration. Always the same default object. */
export function getProfileServerSnapshot(): UserProfile {
  return DEFAULT_PROFILE;
}

/** Convenience for one-off reads. */
export function getProfile(): UserProfile {
  return getProfileSnapshot();
}

/**
 * Persist a partial update. Only provided fields are written; everything
 * else is preserved as-is.
 */
export function updateProfile(patch: Partial<UserProfile>): UserProfile {
  const current = readRaw();
  const next: UserProfile = {
    ...current,
    ...patch,
    weights: { ...current.weights, ...(patch.weights ?? {}) },
  };
  writeAll(next);
  return next;
}

/** Reset everything back to `DEFAULT_PROFILE`. */
export function resetProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  invalidateSnapshot();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToProfile(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
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
