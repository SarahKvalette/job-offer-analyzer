"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type ApiError = { error: { code: string; message: string } };

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        const msg =
          res.status === 401
            ? t.auth.incorrect
            : err?.error?.message ?? t.auth.failed;
        throw new Error(msg);
      }
      toast.success(t.auth.success);
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.auth.failed;
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="owner-password"
          className="text-muted-foreground mb-1.5 block text-xs font-medium uppercase tracking-wider"
        >
          <Lock className="mr-1 inline size-3" />
          {t.auth.passwordLabel}
        </label>
        <input
          id="owner-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        />
      </div>
      <Button type="submit" disabled={pending || !password} size="lg">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.auth.submitting}
          </>
        ) : (
          t.auth.submit
        )}
      </Button>
    </form>
  );
}
