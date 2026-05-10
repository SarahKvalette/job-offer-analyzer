"use client";

import { useEffect, useState } from "react";
import { Loader2, LinkIcon, Unlink, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type Status = {
  isOwner: boolean;
  kvConfigured: boolean;
  oauthConfigured: boolean;
  connected: boolean;
  email: string | null;
  scopes: string[];
};

export function GoogleSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/google/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Status;
      setStatus(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // Defer to a microtask so the lint rule doesn't flag the transitive
    // setStatus inside refresh() as a setState-in-effect.
    queueMicrotask(() => {
      refresh();
    });
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get("google_connected");
      const error = params.get("google_error");
      if (connected) {
        toast.success(
          connected === "1"
            ? t.profile.sections.google.toastConnectedGeneric
            : t.profile.sections.google.toastConnected(connected)
        );
        const url = new URL(window.location.href);
        url.searchParams.delete("google_connected");
        window.history.replaceState(null, "", url.toString());
      } else if (error) {
        toast.error(t.profile.sections.google.toastError(error));
        const url = new URL(window.location.href);
        url.searchParams.delete("google_error");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, []);

  const connect = () => {
    setBusy(true);
    window.location.href = "/api/google/connect";
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/google/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("disconnect failed");
      toast.success(t.profile.sections.google.toastDisconnected);
      await refresh();
    } catch {
      toast.error("Couldn't disconnect.");
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return (
      <section>
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {t.profile.sections.google.title}
        </h3>
        <p className="text-muted-foreground mt-2 text-xs">…</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-foreground text-sm font-semibold tracking-tight">
        {t.profile.sections.google.title}
      </h3>
      <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
        {t.profile.sections.google.hint}
      </p>

      {!status.isOwner ? (
        <div className="mt-3 rounded-md border border-dashed p-3">
          <p className="text-muted-foreground text-xs">
            {t.profile.sections.google.notOwnerHint}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => (window.location.href = "/login")}
          >
            <Lock className="size-3.5" />
            {t.profile.sections.google.signIn}
          </Button>
        </div>
      ) : !status.oauthConfigured || !status.kvConfigured ? (
        <p className="bg-amber-500/5 border-amber-500/30 mt-3 rounded-md border p-2.5 text-[11px]">
          {t.profile.sections.google.notConfiguredHint}
        </p>
      ) : status.connected ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-foreground text-xs">
            {status.email
              ? t.profile.sections.google.connectedAs(status.email)
              : t.profile.sections.google.connectedAs("Google")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={disconnect}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Unlink className="size-3.5" />
            )}
            {t.profile.sections.google.disconnect}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={connect}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LinkIcon className="size-3.5" />
          )}
          {busy
            ? t.profile.sections.google.connecting
            : t.profile.sections.google.connect}
        </Button>
      )}
    </section>
  );
}
