import "server-only";
import { z } from "zod";
import { Resend } from "resend";
import { getKv, isKvConfigured, KV_KEYS } from "./kv";

/**
 * Weekly digest email — owner-only, opt-in.
 *
 * What we send: a short HTML email with a single CTA to /stats. We do NOT
 * include any analysis content in the email — keeps the cron stateless
 * and dodges the "your private notes were sent through a third-party
 * email provider" concern.
 *
 * What lives in KV: { enabled, email, lastSentAt? }.
 */

const preferencesSchema = z.object({
  enabled: z.boolean(),
  email: z.string().email().or(z.literal("")),
  lastSentAt: z.number().optional(),
});
export type DigestPreferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: DigestPreferences = {
  enabled: false,
  email: "",
};

function readEnv(): {
  apiKey: string;
  fromAddress: string;
  appUrl: string;
} {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set.");
  const fromAddress =
    process.env.RESEND_FROM_ADDRESS ?? "Job Offer Analyzer <onboarding@resend.dev>";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://job-offer-analyzer.vercel.app";
  return { apiKey, fromAddress, appUrl };
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function getDigestPreferences(): Promise<DigestPreferences> {
  if (!isKvConfigured()) return DEFAULT_PREFERENCES;
  const kv = getKv();
  const raw = await kv.get<string | object>(KV_KEYS.digestPreferences);
  if (!raw) return DEFAULT_PREFERENCES;
  const candidate = typeof raw === "string" ? safeJson(raw) : raw;
  const parsed = preferencesSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
}

export async function saveDigestPreferences(
  patch: Partial<DigestPreferences>
): Promise<DigestPreferences> {
  const current = await getDigestPreferences();
  const next: DigestPreferences = { ...current, ...patch };
  const kv = getKv();
  await kv.set(KV_KEYS.digestPreferences, JSON.stringify(next));
  return next;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function buildHtml(opts: { appUrl: string }): string {
  const stats = `${opts.appUrl.replace(/\/$/, "")}/stats`;
  const pipeline = `${opts.appUrl.replace(/\/$/, "")}/pipeline`;
  return /* html */ `<!doctype html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7f7f8; padding:32px; margin:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto">
    <tr><td style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
      <p style="margin:0 0 4px;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280">Job Offer Analyzer · weekly</p>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;letter-spacing:-0.01em;color:#0b0b10">Time for your weekly check-in</h1>
      <p style="margin:0 0 16px;color:#374151;line-height:1.6">A quick reminder to glance at your pipeline and your stats. Two minutes is usually all you need.</p>
      <p style="margin:24px 0">
        <a href="${stats}" style="display:inline-block;background:#0b0b10;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:500;margin-right:8px">Open your stats</a>
        <a href="${pipeline}" style="display:inline-block;background:#fff;color:#0b0b10;text-decoration:none;padding:10px 16px;border-radius:8px;border:1px solid #e5e7eb;font-weight:500">Pipeline</a>
      </p>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">Sent by your own Job Offer Analyzer instance · <a style="color:#9ca3af" href="${opts.appUrl}">${opts.appUrl}</a></p>
    </td></tr>
  </table>
</body></html>`;
}

/** Send the digest now to the configured recipient. Used by the cron and the manual test button. */
export async function sendDigest(opts?: {
  to?: string;
}): Promise<{ id: string }> {
  const { apiKey, fromAddress, appUrl } = readEnv();
  const prefs = await getDigestPreferences();
  const to = opts?.to ?? prefs.email;
  if (!to) throw new Error("No recipient email set.");

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Your weekly Job Offer Analyzer check-in",
    html: buildHtml({ appUrl }),
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  if (prefs.enabled) {
    await saveDigestPreferences({ lastSentAt: Date.now() });
  }
  return { id: result.data?.id ?? "unknown" };
}
