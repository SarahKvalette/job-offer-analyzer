"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type Prefs = {
  enabled: boolean;
  email: string;
  lastSentAt?: number;
  kvConfigured: boolean;
  resendConfigured: boolean;
};

type ApiError = { error: { code: string; message: string } };

export function DigestSection() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [savingPatch, setSavingPatch] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/digest/preferences", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as Prefs;
      setPrefs(data);
      setEmailDraft(data.email);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  const patch = async (body: Partial<Prefs>) => {
    setSavingPatch(true);
    try {
      const res = await fetch("/api/digest/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? "Save failed.");
      }
      const data = (await res.json()) as Prefs;
      setPrefs((current) => ({ ...(current ?? data), ...data }));
      toast.success(t.digest.saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSavingPatch(false);
    }
  };

  const sendTest = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/digest/send-test", { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? t.digest.failed);
      }
      toast.success(t.digest.sent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.digest.failed;
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (!prefs) {
    return (
      <section>
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {t.digest.sectionTitle}
        </h3>
        <p className="text-muted-foreground mt-2 text-xs">…</p>
      </section>
    );
  }

  const ready = prefs.kvConfigured && prefs.resendConfigured;

  return (
    <section>
      <h3 className="text-foreground text-sm font-semibold tracking-tight">
        {t.digest.sectionTitle}
      </h3>
      <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
        {t.digest.sectionHint}
      </p>

      {!ready ? (
        <p className="bg-amber-500/5 border-amber-500/30 mt-3 rounded-md border p-2.5 text-[11px]">
          {t.digest.notConfigured}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
              disabled={savingPatch || !emailDraft}
              className="size-4 rounded"
            />
            <span className="text-foreground">{t.digest.enabledLabel}</span>
          </label>

          <div>
            <label className="text-muted-foreground mb-1 block text-[11px] font-medium uppercase tracking-wider">
              {t.digest.emailLabel}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onBlur={() => {
                  if (emailDraft !== prefs.email) patch({ email: emailDraft });
                }}
                placeholder={t.digest.emailPlaceholder}
                className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={sendTest}
                disabled={sending || !prefs.email}
              >
                {sending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                {sending ? t.digest.sending : t.digest.sendNow}
              </Button>
            </div>
            {prefs.lastSentAt && (
              <p className="text-muted-foreground mt-1 text-[11px]">
                <Mail className="mr-1 inline size-3" />
                Last sent {new Date(prefs.lastSentAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
