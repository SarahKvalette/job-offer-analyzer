"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, Calendar, MailQuestion } from "lucide-react";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeToHistory,
} from "@/lib/storage/history";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";

const FOLLOWUP_THRESHOLD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

interface Reminder {
  id: string;
  entryId: string;
  kind: "followup" | "next-action";
  text: string;
}

function buildReminders(items: readonly StoredAnalysis[]): Reminder[] {
  const now = Date.now();
  const out: Reminder[] = [];
  for (const entry of items) {
    const app = entry.application;
    if (!app) continue;

    // Follow-up suggestion: applied >= 14 days ago, no offer / rejection yet
    if (
      app.status === "applied" &&
      app.appliedAt &&
      now - app.appliedAt >= FOLLOWUP_THRESHOLD_DAYS * DAY_MS
    ) {
      const days = Math.floor((now - app.appliedAt) / DAY_MS);
      out.push({
        id: `followup-${entry.id}`,
        entryId: entry.id,
        kind: "followup",
        text: t.reminders.followupSuggestion(
          entry.analysis.meta.company ?? entry.analysis.meta.title,
          days
        ),
      });
    }

    // Upcoming next action — show if due in the next 7 days or overdue
    if (app.nextAction && app.nextAction.dueAt !== null) {
      const dueIn = app.nextAction.dueAt - now;
      if (dueIn <= 7 * DAY_MS) {
        out.push({
          id: `action-${entry.id}`,
          entryId: entry.id,
          kind: "next-action",
          text: t.reminders.upcomingAction(
            entry.analysis.meta.company ?? entry.analysis.meta.title,
            app.nextAction.description
          ),
        });
      }
    }
  }
  return out;
}

export function RemindersBanner() {
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );
  const reminders = useMemo(() => buildReminders(items), [items]);

  if (reminders.length === 0) return null;

  return (
    <section
      aria-label={t.reminders.title}
      className="bg-amber-500/5 border-amber-500/30 rounded-lg border p-3"
    >
      <header className="text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
        <Bell className="size-3.5" />
        {t.reminders.title}
      </header>
      <ul className="space-y-1.5">
        {reminders.map((r) => (
          <li key={r.id}>
            <Link
              href={`/?id=${r.entryId}`}
              className="text-foreground/90 hover:text-foreground flex items-center gap-2 text-sm hover:underline"
            >
              {r.kind === "followup" ? (
                <MailQuestion className="text-amber-600 dark:text-amber-400 size-3.5 shrink-0" />
              ) : (
                <Calendar className="text-amber-600 dark:text-amber-400 size-3.5 shrink-0" />
              )}
              {r.text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
