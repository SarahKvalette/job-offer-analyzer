"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { trackEvent } from "@/lib/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_VISIT_KEY = "joa.firstVisitAt";
const D7_FIRED_KEY = "joa.d7Fired";

/**
 * Mounts Vercel Web Analytics and emits the anonymous `return_visit_d7`
 * event once, when a visitor comes back 7+ days after their first visit.
 * Detection uses a single local timestamp — no persistent identifier, no
 * cookie, nothing sent to a server beyond the anonymous event itself.
 */
export function AnalyticsProvider() {
  useEffect(() => {
    try {
      const now = Date.now();
      const first = window.localStorage.getItem(FIRST_VISIT_KEY);
      if (!first) {
        window.localStorage.setItem(FIRST_VISIT_KEY, String(now));
      } else if (
        !window.localStorage.getItem(D7_FIRED_KEY) &&
        now - Number(first) >= 7 * DAY_MS
      ) {
        window.localStorage.setItem(D7_FIRED_KEY, "1");
        trackEvent("return_visit_d7");
      }
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }, []);

  return <Analytics />;
}
