"use client";

import { useState } from "react";
import { Mail, ExternalLink, Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  threadId: string;
  from: { name: string; email: string; domain: string };
  subject: string;
  snippet: string;
  receivedAt: number;
  body: string;
  signal: { domainMatch: boolean; keywordMatches: string[] };
}

type ApiError = { error: { code: string; message: string } };

const APP_BASE =
  typeof window !== "undefined" ? window.location.origin : "";

export function GmailScanPanel() {
  const [pending, setPending] = useState(false);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleScan = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/gmail/scan?days=14&max=25", {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        const msg =
          res.status === 409
            ? t.gmail.notConnected
            : err?.error?.message ?? t.gmail.failed;
        throw new Error(msg);
      }
      const data = (await res.json()) as { leads: Lead[] };
      setLeads(data.leads);
      if (data.leads.length === 0) {
        toast.message(t.gmail.empty);
      } else {
        toast.success(t.gmail.foundCount(data.leads.length));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.gmail.failed;
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  const analyse = (lead: Lead) => {
    const text = `${lead.subject}\n\nFrom: ${lead.from.name} <${lead.from.email}>\n\n${lead.body}`;
    const fragment = encodeURIComponent(text);
    window.open(`${APP_BASE}/#analyze=${fragment}`, "_blank");
  };

  const visible = leads?.filter((l) => !dismissed.has(l.id)) ?? [];

  return (
    <section className="bg-card rounded-lg border p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Mail className="size-4" />
          Recruiter inbox
          <span className="text-muted-foreground text-xs font-normal">
            · {t.gmail.daysLabel}
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleScan}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {t.gmail.scanning}
            </>
          ) : (
            <>
              <Mail className="size-3.5" />
              {leads === null ? t.gmail.scanCta : "Re-scan"}
            </>
          )}
        </Button>
      </header>

      {visible.length > 0 && (
        <ul className="mt-3 space-y-2">
          {visible.map((lead) => (
            <li
              key={lead.id}
              className={cn(
                "bg-muted/30 rounded-md border p-3",
                lead.signal.domainMatch && "border-violet-500/30 bg-violet-500/[0.03]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {lead.subject || "(no subject)"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {lead.from.name} · {lead.from.email}
                  </p>
                  <p className="text-muted-foreground/80 mt-1 line-clamp-2 text-xs">
                    {lead.snippet}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setDismissed((prev) => {
                      const next = new Set(prev);
                      next.add(lead.id);
                      return next;
                    })
                  }
                  aria-label={t.gmail.dismiss}
                >
                  <X className="size-3" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {lead.signal.domainMatch && (
                  <span className="border-violet-500/40 text-violet-700 dark:text-violet-300 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium">
                    {t.gmail.domainBadge}
                  </span>
                )}
                {lead.signal.keywordMatches.length > 0 && (
                  <span className="border-border text-muted-foreground inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]">
                    {t.gmail.keywordBadge(lead.signal.keywordMatches.length)}
                  </span>
                )}
                <a
                  href={`https://mail.google.com/mail/u/0/#inbox/${lead.threadId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5 text-[10px]"
                >
                  <ExternalLink className="size-2.5" />
                  {t.gmail.openInGmail}
                </a>
                <Button
                  variant="ghost"
                  size="xs"
                  className="ml-auto"
                  onClick={() => analyse(lead)}
                >
                  <Sparkles className="size-3" />
                  {t.gmail.analyse}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {leads !== null && visible.length === 0 && (
        <p className="text-muted-foreground mt-3 text-xs">{t.gmail.empty}</p>
      )}
    </section>
  );
}
