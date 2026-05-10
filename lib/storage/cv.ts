"use client";

import {
  CURRENT_CV_VERSION,
  DEFAULT_CV,
  userCvSchema,
  type UserCV,
} from "@/lib/schemas/cv";

const STORAGE_KEY = "joa.cv.v1";
const CHANGE_EVENT = "joa:cv-change";

let snapshot: UserCV | null = null;

function invalidateSnapshot(): void {
  snapshot = null;
}

function readRaw(): UserCV {
  if (typeof window === "undefined") return DEFAULT_CV;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_CV;
  try {
    const parsed = JSON.parse(raw);
    const result = userCvSchema.safeParse(parsed);
    if (!result.success) return DEFAULT_CV;
    return migrate(result.data);
  } catch {
    return DEFAULT_CV;
  }
}

function migrate(cv: UserCV): UserCV {
  const v = cv.schemaVersion ?? 0;
  if (v >= CURRENT_CV_VERSION) return cv;
  return { ...cv, schemaVersion: CURRENT_CV_VERSION };
}

function writeAll(cv: UserCV): void {
  if (typeof window === "undefined") return;
  const stamped: UserCV = { ...cv, schemaVersion: CURRENT_CV_VERSION };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  invalidateSnapshot();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getCvSnapshot(): UserCV {
  if (snapshot === null) snapshot = readRaw();
  return snapshot;
}

export function getCvServerSnapshot(): UserCV {
  return DEFAULT_CV;
}

export function getCv(): UserCV {
  return getCvSnapshot();
}

export function updateCv(patch: Partial<UserCV>): UserCV {
  const current = readRaw();
  const next: UserCV = { ...current, ...patch };
  writeAll(next);
  return next;
}

export function resetCv(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  invalidateSnapshot();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToCv(listener: () => void): () => void {
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
