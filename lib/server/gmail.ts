import "server-only";
import { getAccessToken } from "./google-oauth";

/**
 * Minimal Gmail REST wrapper — list recent messages, classify as
 * recruiter-ish, return parsed candidates the UI can act on.
 *
 * Why not the googleapis SDK: it pulls in ~5 MB of typings and a build
 * step we don't need. The two endpoints we hit are tiny.
 */

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailMessage {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType?: string;
      body?: { data?: string };
      parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
    }>;
  };
  labelIds?: string[];
}

const KNOWN_RECRUITER_DOMAINS = new Set([
  "linkedin.com",
  "welcometothejungle.com",
  "indeed.com",
  "indeed.fr",
  "jobteaser.com",
  "talent.io",
  "hays.com",
  "hays.fr",
  "robertwalters.com",
  "robertwalters.fr",
  "michaelpage.com",
  "michaelpage.fr",
  "pagepersonnel.fr",
  "pagegroup.com",
  "kellyservices.com",
  "manpower.fr",
  "manpowergroup.com",
  "randstad.com",
  "randstad.fr",
  "fed-it.fr",
  "expectra.fr",
  "computerfutures.com",
  "sthree.com",
  "approach-people.com",
]);

const RECRUITER_KEYWORDS = [
  "opportunit",
  "opportunité",
  "poste",
  "role at",
  "role @",
  "rôle",
  "engineer",
  "developer",
  "développeur",
  "join our team",
  "rejoindre",
  "we'd love to chat",
  "ravis de",
  "candidature",
  "open to a chat",
  "open to chat",
  "hiring",
  "recruit",
  "fit for",
  "interview",
  "entretien",
];

const SKIP_LABELS = new Set(["SPAM", "TRASH"]);

export interface RecruiterLead {
  id: string;
  threadId: string;
  from: { name: string; email: string; domain: string };
  subject: string;
  snippet: string;
  receivedAt: number;
  /** Best-effort body text — first 3000 chars, decoded from base64url. */
  body: string;
  signal: {
    domainMatch: boolean;
    keywordMatches: string[];
  };
}

async function gmailFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gmail API ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function decodeBase64Url(s: string): string {
  const normalised = s.replace(/-/g, "+").replace(/_/g, "/");
  // pad
  const padded = normalised + "===".slice((normalised.length + 3) % 4);
  try {
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractText(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return "";

  // Prefer text/plain part if available
  function walk(
    part: NonNullable<GmailMessage["payload"]>
  ): string {
    if (part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    const parts = part.parts ?? [];
    // text/plain wins over text/html
    const plain = parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = parts.find((p) => p.mimeType === "text/html");
    if (html?.body?.data) {
      // strip tags very loosely
      return decodeBase64Url(html.body.data)
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ");
    }
    for (const sub of parts) {
      if (sub.parts) {
        const r = walk(sub as NonNullable<GmailMessage["payload"]>);
        if (r) return r;
      }
    }
    return "";
  }

  return walk(payload).slice(0, 3000);
}

function parseFrom(value: string): {
  name: string;
  email: string;
  domain: string;
} {
  // "Foo Bar <foo@bar.com>" or just "foo@bar.com"
  const match = /<\s*([^>]+)\s*>/.exec(value);
  const email = (match ? match[1] : value).trim();
  const name = (match ? value.slice(0, match.index) : "").trim().replace(/"/g, "");
  const at = email.indexOf("@");
  const domain = at >= 0 ? email.slice(at + 1).toLowerCase() : "";
  return { name: name || email, email, domain };
}

function header(message: GmailMessage, name: string): string | undefined {
  return message.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

function classify(message: GmailMessage): RecruiterLead | null {
  if (!message.payload) return null;
  if (message.labelIds?.some((l) => SKIP_LABELS.has(l))) return null;

  const subject = header(message, "Subject") ?? "";
  const fromRaw = header(message, "From");
  if (!fromRaw) return null;
  const from = parseFrom(fromRaw);

  const domainMatch = KNOWN_RECRUITER_DOMAINS.has(from.domain);
  const haystack = `${subject}\n${message.snippet ?? ""}`.toLowerCase();
  const keywordMatches = RECRUITER_KEYWORDS.filter((k) => haystack.includes(k));

  // Threshold: known recruiter domain OR 2+ keyword matches
  if (!domainMatch && keywordMatches.length < 2) return null;

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    subject,
    snippet: message.snippet ?? "",
    receivedAt: Number(message.internalDate ?? 0),
    body: extractText(message),
    signal: { domainMatch, keywordMatches },
  };
}

/**
 * Scan the user's inbox for the last `days` days, return up to
 * `maxResults` recruiter-looking messages with their parsed body.
 *
 * Costs ~ 1 + N Gmail API calls (1 list + N message details). We cap N
 * at the input ceiling to keep this within free-tier quotas.
 */
export async function scanRecruiterLeads(opts: {
  days?: number;
  maxResults?: number;
} = {}): Promise<RecruiterLead[]> {
  const days = Math.max(1, Math.min(90, opts.days ?? 14));
  const maxResults = Math.max(5, Math.min(50, opts.maxResults ?? 25));

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Google account is not connected.");
  }

  const query = encodeURIComponent(
    `category:primary newer_than:${days}d -from:noreply -from:no-reply`
  );
  const list = await gmailFetch<GmailListResponse>(
    `/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${query}`,
    accessToken
  );

  const ids = list.messages?.map((m) => m.id) ?? [];
  if (ids.length === 0) return [];

  const leads: RecruiterLead[] = [];
  for (const id of ids) {
    try {
      const msg = await gmailFetch<GmailMessage>(
        `/gmail/v1/users/me/messages/${id}?format=full`,
        accessToken
      );
      const lead = classify(msg);
      if (lead) leads.push(lead);
    } catch (err) {
      // Skip individual failures — don't abort the whole scan
      console.warn("gmail fetch failed for", id, err);
    }
  }

  return leads.sort((a, b) => b.receivedAt - a.receivedAt);
}
