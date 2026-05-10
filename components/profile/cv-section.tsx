"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { FileText, FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getCvSnapshot,
  getCvServerSnapshot,
  resetCv,
  subscribeToCv,
  updateCv,
} from "@/lib/storage/cv";
import { isCvEmpty } from "@/lib/schemas/cv";
import { t } from "@/lib/i18n";

type ApiError = { error: { code: string; message: string } };

function nowMs(): number {
  return Date.now();
}

export function CvSection() {
  const cv = useSyncExternalStore(
    subscribeToCv,
    getCvSnapshot,
    getCvServerSnapshot
  );
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const empty = isCvEmpty(cv);

  const handleFile = async (file: File) => {
    if (
      !file.name.toLowerCase().endsWith(".pdf") &&
      file.type !== "application/pdf"
    ) {
      toast.error(t.profile.sections.cv.extractFailed);
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/extract-pdf", { method: "POST", body: fd });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? t.profile.sections.cv.extractFailed);
      }
      const data = (await res.json()) as { text: string };
      updateCv({ rawText: data.text, fileName: file.name, parsedAt: nowMs() });
      toast.success(t.profile.sections.cv.extractedToast);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t.profile.sections.cv.extractFailed;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {t.profile.sections.cv.title}
        </h3>
        {!empty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetCv();
              toast.success(t.profile.sections.cv.clearCv);
            }}
          >
            <Trash2 className="size-3.5" />
            {t.profile.sections.cv.clearCv}
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mb-3 text-[11px] leading-relaxed">
        {t.profile.sections.cv.hint}
      </p>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileUp className="size-3.5" />
            )}
            {empty
              ? t.profile.sections.cv.uploadPdf
              : t.profile.sections.cv.replacePdf}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {cv.fileName && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
              <FileText className="size-3" />
              {t.profile.sections.cv.loadedFrom(cv.fileName)}
            </span>
          )}
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-[11px] font-medium uppercase tracking-wider">
            {t.profile.sections.cv.editLabel}
          </label>
          <textarea
            value={cv.rawText}
            onChange={(e) => updateCv({ rawText: e.target.value })}
            placeholder={t.profile.sections.cv.editPlaceholder}
            rows={6}
            className="bg-card border-input focus-visible:ring-ring/30 focus-visible:border-ring w-full resize-y rounded-md border px-3 py-2 font-mono text-[12px] leading-relaxed outline-none focus-visible:ring-2"
          />
          <p className="text-muted-foreground mt-1 text-[11px]">
            {t.profile.sections.cv.editHint}
          </p>
        </div>
      </div>
    </section>
  );
}
