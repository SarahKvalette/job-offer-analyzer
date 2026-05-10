import "server-only";
import { z } from "zod";
import { getKv, KV_KEYS } from "./kv";

/**
 * Google OAuth 2.0 flow (server-side, single-user).
 *
 * Token bundle stored in KV as JSON:
 *   {
 *     accessToken, refreshToken,
 *     expiresAt (ms epoch),
 *     scope, email
 *   }
 *
 * Single user → single key (KV_KEYS.googleTokens). No per-user namespace.
 *
 * Scopes requested at consent time (one-shot for the whole Phase 6):
 *   - openid / userinfo.email / userinfo.profile → know who's connected
 *   - gmail.readonly                              → M2 recruiter scan
 *   - calendar.events                             → M3 event creation
 */

export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

const AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const storedTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  scope: z.string(),
  email: z.string().nullable(),
});
export type StoredGoogleTokens = z.infer<typeof storedTokensSchema>;

function readEnv(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_ENV === "production"
      ? "https://job-offer-analyzer.vercel.app"
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, "")}/api/google/callback`,
  };
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Build the URL the user is redirected to for consent. `state` is an
 * arbitrary opaque value we'll verify in the callback to prevent CSRF.
 */
export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = readEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // force the refresh_token even on subsequent connects
    state,
    include_granted_scopes: "true",
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

async function postTokenForm(
  body: URLSearchParams
): Promise<GoogleTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token endpoint returned ${res.status}: ${text}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

async function fetchUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string };
  return json.email ?? null;
}

/**
 * Exchange the OAuth code for tokens, fetch the user's email, and
 * persist the bundle in KV.
 */
export async function exchangeCodeAndStore(code: string): Promise<StoredGoogleTokens> {
  const { clientId, clientSecret, redirectUri } = readEnv();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const data = await postTokenForm(body);
  if (!data.refresh_token) {
    throw new Error(
      "Google did not return a refresh_token. Revoke previous access at https://myaccount.google.com/permissions and reconnect."
    );
  }

  const email = await fetchUserEmail(data.access_token);
  const stored: StoredGoogleTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? "",
    email,
  };

  const kv = getKv();
  await kv.set(KV_KEYS.googleTokens, JSON.stringify(stored));
  return stored;
}

export async function getStoredTokens(): Promise<StoredGoogleTokens | null> {
  const kv = getKv();
  const raw = await kv.get<string | object>(KV_KEYS.googleTokens);
  if (!raw) return null;
  const candidate = typeof raw === "string" ? safeJsonParse(raw) : raw;
  const parsed = storedTokensSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Return a valid access token, refreshing it transparently when the
 * stored one is within 60 s of expiry. Returns null when no tokens are
 * stored. Throws on refresh failure (caller should treat as
 * "disconnected" and prompt re-consent).
 */
export async function getAccessToken(): Promise<string | null> {
  const stored = await getStoredTokens();
  if (!stored) return null;

  if (stored.expiresAt > Date.now() + 60_000) {
    return stored.accessToken;
  }

  const { clientId, clientSecret } = readEnv();
  const body = new URLSearchParams({
    refresh_token: stored.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const data = await postTokenForm(body);
  const next: StoredGoogleTokens = {
    ...stored,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? stored.scope,
  };
  const kv = getKv();
  await kv.set(KV_KEYS.googleTokens, JSON.stringify(next));
  return next.accessToken;
}

export async function disconnectGoogle(): Promise<void> {
  const stored = await getStoredTokens();
  if (stored?.refreshToken) {
    // Best-effort revocation — don't fail the disconnect if it errors out.
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(
          stored.refreshToken
        )}`,
        { method: "POST" }
      );
    } catch {
      /* ignore */
    }
  }
  const kv = getKv();
  await kv.del(KV_KEYS.googleTokens);
}

/**
 * High-level status used by `/api/google/status`. Doesn't refresh — just
 * reports what we have stored.
 */
export async function getConnectionStatus(): Promise<{
  connected: boolean;
  email: string | null;
  scopes: string[];
}> {
  const stored = await getStoredTokens();
  if (!stored) return { connected: false, email: null, scopes: [] };
  return {
    connected: true,
    email: stored.email,
    scopes: stored.scope.split(/\s+/).filter(Boolean),
  };
}
