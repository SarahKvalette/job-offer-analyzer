"use client";

import { useState, useSyncExternalStore } from "react";
import { Sparkles, Loader2, Copy, Check, FileEdit, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCvSnapshot,
  getCvServerSnapshot,
  subscribeToCv,
} from "@/lib/storage/cv";
import { isCvEmpty } from "@/lib/schemas/cv";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Kind =
  | "cover-letter"
  | "linkedin-message"
  | "email"
  | "interview-prep"
  | "ats-keywords";
type Tone = "neutral" | "enthusiastic" | "direct";

const KINDS: Kind[] = [
  "cover-letter",
  "linkedin-message",
  "email",
  "interview-prep",
  "ats-keywords",
];
const TONES: Tone[] = ["neutral", "enthusiastic", "direct"];

type ApiError = { error: { code: string; message: string } };

export function GenerationCard({ entry }: { entry: StoredAnalysis }) {
  const cv = useSyncExternalStore(
    subscribeToCv,
    getCvSnapshot,
    getCvServerSnapshot
  );
  const [kind, setKind] = useState<Kind>("cover-letter");
  const [tone, setTone] = useState<Tone>("neutral");
  const [output, setOutput] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const cvMissing = isCvEmpty(cv);

  const handleGenerate = async () => {
    if (cvMissing) return;
    setPending(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          tone,
          jobText: entry.jobText,
          cvText: cv.rawText,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? "Generation failed.");
      }
      const data = (await res.json()) as { content: string };
      setOutput(data.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success(t.result.generation.copyToast);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.result.generation.copyError);
    }
  };

  if (cvMissing) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="size-5" />
            {t.result.generation.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm font-medium">
            {t.result.generation.cvMissing.title}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t.result.generation.cvMissing.body}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              const trigger = document.querySelector<HTMLElement>(
                'button[aria-label="Open your profile"]'
              );
              trigger?.click();
            }}
          >
            <User className="size-3.5" />
            {t.result.generation.cvMissing.cta}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="size-5" />
          {t.result.generation.title}
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          {t.result.generation.hint}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format selector */}
        <div>
          <label className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
            {t.result.generation.labelKind}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  kind === k
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40 hover:bg-muted/50"
                )}
              >
                {t.result.generation.kinds[k]}
              </button>
            ))}
          </div>
        </div>

        {/* Tone selector */}
        <div>
          <label className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
            {t.result.generation.labelTone}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((to) => (
              <button
                key={to}
                type="button"
                onClick={() => setTone(to)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  tone === to
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40 hover:bg-muted/50"
                )}
              >
                {t.result.generation.tones[to]}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            size="sm"
          >
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t.result.generation.generating}
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                {output
                  ? t.result.generation.regenerate
                  : t.result.generation.generate}
              </>
            )}
          </Button>
          {output && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? t.result.generation.copied : t.result.generation.copy}
            </Button>
          )}
        </div>

        {/* Output */}
        <div
          className={cn(
            "bg-muted/20 min-h-[200px] rounded-md border p-4",
            !output && !pending && "border-dashed"
          )}
        >
          {output ? (
            <pre className="text-foreground/90 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {output}
            </pre>
          ) : (
            <p className="text-muted-foreground/70 text-sm">
              {t.result.generation.empty}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
