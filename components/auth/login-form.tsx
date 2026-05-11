"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

const ERROR_LABELS: Record<string, string> = {
  not_authorized: "This Google account isn't on the owner allowlist.",
  state_mismatch: "Sign-in link expired. Try again.",
  missing_params: "Sign-in was interrupted. Try again.",
  exchange_failed: "Google rejected the token exchange. Try again.",
  access_denied: "You declined the Google permissions.",
};

export function LoginForm({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError: string | null;
}) {
  const [pending, setPending] = useState(false);
  const error = initialError
    ? (ERROR_LABELS[initialError] ?? "Sign-in failed. Try again.")
    : null;

  const handleSignIn = () => {
    setPending(true);
    const url = `/api/auth/google?next=${encodeURIComponent(nextPath)}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        size="lg"
        className="w-full"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.auth.submitting}
          </>
        ) : (
          <>
            <GoogleGlyph className="size-4" />
            {t.auth.submit}
          </>
        )}
      </Button>

      {error && (
        <p
          role="alert"
          className="bg-red-500/5 border-red-500/30 text-red-700 dark:text-red-300 rounded-md border p-3 text-xs"
        >
          {error}
        </p>
      )}

      <p className="text-muted-foreground text-[11px] leading-relaxed">
        {t.auth.allowlistHint}
      </p>
    </div>
  );
}

/**
 * Small inline Google "G" mark — kept as raw SVG so we don't need a
 * separate brand-icon dependency.
 */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.56c2.08-1.92 3.28-4.74 3.28-8.08z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.75c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
