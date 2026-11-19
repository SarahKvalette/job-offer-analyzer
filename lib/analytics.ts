"use client";

import { track } from "@vercel/analytics";

/**
 * Anonymous product metrics (Vercel Web Analytics — cookieless, no consent
 * banner, no persistent identifier).
 *
 * Events are fired WITHOUT properties: no posting text, no company name, no
 * score — only the fact that something happened. See the "Ce que nous
 * mesurons" panel in the profile drawer.
 */
export type AnalyticsEvent =
  | "analysis_started"
  | "analysis_saved"
  | "followup_scheduled"
  | "return_visit_d7"
  | "demo_example_opened";

export function trackEvent(event: AnalyticsEvent): void {
  try {
    track(event);
  } catch {
    // Analytics must never break the app (e.g. blocked by an ad-blocker).
  }
}
