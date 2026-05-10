import "server-only";
import { getAccessToken } from "./google-oauth";

/**
 * Minimal Google Calendar wrapper — create a single event on the user's
 * primary calendar, return its public URL.
 */

interface CreateEventInput {
  summary: string;
  description?: string;
  /** ISO 8601 timestamp, e.g. 2026-05-12T14:00:00+02:00 */
  startISO: string;
  /** Defaults to start + 60 min when omitted. */
  endISO?: string;
  /** IANA timezone (e.g. "Europe/Paris"). Defaults to UTC. */
  timeZone?: string;
}

interface CalendarEventResponse {
  id: string;
  htmlLink: string;
  status: string;
}

export async function createCalendarEvent(
  input: CreateEventInput
): Promise<{ id: string; htmlLink: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Google account is not connected.");
  }

  const start = new Date(input.startISO);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid startISO date.");
  }
  const end = input.endISO
    ? new Date(input.endISO)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const body = {
    summary: input.summary,
    description: input.description ?? "",
    start: {
      dateTime: start.toISOString(),
      timeZone: input.timeZone ?? "UTC",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: input.timeZone ?? "UTC",
    },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Calendar API ${res.status}: ${text.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as CalendarEventResponse;
  return { id: json.id, htmlLink: json.htmlLink };
}
