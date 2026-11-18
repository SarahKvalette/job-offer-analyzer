"use client";

import { useEffect, useState } from "react";

/**
 * Client-side owner detection.
 *
 * Hits `/api/auth/me` (a cheap cookie check) once per page load and memoises
 * the result at module scope so the nav, the profile drawer, the command
 * palette and the pipeline page share a single request.
 *
 * Default is `isOwner: false` until the check resolves — so owner-only UI
 * stays hidden for the public and never flashes before the fetch returns.
 * Security itself lives server-side (every owner route calls `isOwnerSession`);
 * this hook only governs what we bother rendering.
 */

let cache: boolean | null = null;
let inflight: Promise<boolean> | null = null;

function fetchOwner(): Promise<boolean> {
  if (cache !== null) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { isOwner: false }))
      .then((data: { isOwner?: unknown }) => {
        cache = Boolean(data?.isOwner);
        return cache;
      })
      .catch(() => {
        cache = false;
        return false;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useOwner(): { isOwner: boolean; loaded: boolean } {
  const [state, setState] = useState<{ isOwner: boolean; loaded: boolean }>(
    cache === null
      ? { isOwner: false, loaded: false }
      : { isOwner: cache, loaded: true }
  );

  useEffect(() => {
    let active = true;
    fetchOwner().then((isOwner) => {
      if (active) setState({ isOwner, loaded: true });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
