"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, FileUp, FileText, X, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SAMPLE = `Senior Full-Stack Engineer @ Acme Inc.

We're a fast-paced startup looking for a rockstar engineer to wear many hats. You'll own everything from frontend to backend in a like-a-family environment. Competitive salary.

Requirements:
- 7+ years of experience with React and Node.js
- Strong knowledge of TypeScript, PostgreSQL, AWS
- Experience leading projects end-to-end
- Bonus: GraphQL, Kubernetes, Terraform

We offer:
- Remote-friendly (Paris HQ, 2 days on-site)
- Stock options
- Modern stack`;

const MIN_CHARS = 50;
const MAX_CHARS = 25_000;

type ApiError = { error: { code: string; message: string } };

export function JobInputForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const trimmedLen = text.trim().length;
  const tooShort = trimmedLen < MIN_CHARS;
  const tooLong = trimmedLen > MAX_CHARS;
  const disabled = pending || pdfBusy || tooShort || tooLong;

  const handleFile = async (file: File) => {
    if (
      !file.name.toLowerCase().endsWith(".pdf") &&
      file.type !== "application/pdf"
    ) {
      toast.error("Drop a PDF file (or paste text directly).");
      return;
    }
    setPdfBusy(true);
    setPdfName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/extract-pdf", { method: "POST", body: fd });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? "PDF extraction failed.");
      }
      const data = (await res.json()) as { text: string };
      setText(data.text);
      toast.success("PDF text extracted — review and analyze.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF extraction failed.";
      toast.error(msg);
      setPdfName(null);
    } finally {
      setPdfBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !disabled) {
      e.preventDefault();
      onSubmit(text);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit(text);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div
        className={cn(
          "bg-card focus-glow relative flex flex-col overflow-hidden rounded-2xl border shadow-lg shadow-black/[0.04] transition-all dark:shadow-black/30",
          dragOver &&
            "border-[color:var(--accent-violet)]/50 bg-[color:var(--accent-violet)]/5"
        )}
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (pdfName) setPdfName(null);
          }}
          onKeyDown={handleTextareaKey}
          placeholder="Paste a tech job posting, or drop a PDF here."
          rows={12}
          className="text-foreground placeholder:text-muted-foreground/60 min-h-[280px] w-full resize-y bg-transparent px-6 pt-6 pb-3 text-[15px] leading-[1.65] outline-none"
        />

        {pdfName && !dragOver && (
          <div className="bg-muted/60 text-muted-foreground absolute right-4 top-4 flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
            <FileText className="size-3" />
            <span className="max-w-[160px] truncate">{pdfName}</span>
            <button
              type="button"
              onClick={() => {
                setPdfName(null);
                setText("");
              }}
              className="hover:text-foreground"
              aria-label="Remove PDF"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {dragOver && (
          <div className="text-[color:var(--accent-violet)] pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[color:var(--accent-violet)]/5 text-sm font-medium backdrop-blur-sm">
            <FileUp className="mr-2 size-5" /> Drop PDF to extract
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-muted/30 border-border/60 flex items-center justify-between gap-3 border-t px-3 py-2.5">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={pdfBusy}
            >
              {pdfBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileUp className="size-3.5" />
              )}
              PDF
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
            <span aria-hidden className="bg-border mx-1 h-4 w-px" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setText(SAMPLE)}
            >
              <Sparkles className="size-3.5" />
              Sample
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <CharCount
              count={trimmedLen}
              tooShort={tooShort}
              tooLong={tooLong}
            />
            <Button
              type="submit"
              disabled={disabled}
              size="default"
              className="gap-2 px-3.5"
            >
              {pending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  Analyze
                  <kbd className="border-foreground/15 bg-foreground/5 hidden items-center gap-0.5 rounded border px-1 font-mono text-[10px] leading-none sm:inline-flex">
                    <span>⌘</span>
                    <CornerDownLeft className="size-2.5" />
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function CharCount({
  count,
  tooShort,
  tooLong,
}: {
  count: number;
  tooShort: boolean;
  tooLong: boolean;
}) {
  const tone = tooLong
    ? "text-destructive"
    : tooShort
    ? "text-muted-foreground/60"
    : "text-muted-foreground";
  const label = tooLong
    ? `${count.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`
    : tooShort
    ? `${count} / ${MIN_CHARS}`
    : count.toLocaleString();
  return (
    <span className={cn("font-mono text-[11px] tabular-nums", tone)}>
      {label}
    </span>
  );
}
