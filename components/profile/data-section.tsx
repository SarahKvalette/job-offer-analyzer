"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Download, Upload, Check, Database } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeToHistory,
  importAnalyses,
} from "@/lib/storage/history";
import {
  exportToJsonString,
  parseAnalysesImport,
} from "@/lib/storage/export-import";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";

const EXPORT_REMINDER_THRESHOLD = 5;

/**
 * "Your data" panel — export / import of the analysis history with an honest
 * explanation of the local-first privacy model (and its limit), plus a
 * discreet export reminder once a few analyses pile up.
 */
export function DataSection() {
  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<StoredAnalysis[] | null>(
    null
  );

  const s = t.profile.sections.data;

  const handleExport = () => {
    if (items.length === 0) {
      toast.error(s.exportEmpty);
      return;
    }
    const blob = new Blob([exportToJsonString(items)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = s.exportFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(s.exportToast(items.length));
  };

  const handleFile = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error(s.errors.unreadable);
      return;
    }
    const result = parseAnalysesImport(text);
    if (!result.ok) {
      toast.error(s.errors[result.code]);
      return;
    }
    setPendingImport(result.entries);
  };

  const applyImport = (mode: "merge" | "replace") => {
    if (!pendingImport) return;
    const n = importAnalyses(pendingImport, mode);
    setPendingImport(null);
    toast.success(s.importedToast(n));
  };

  return (
    <section>
      <h3 className="text-foreground flex items-center gap-1.5 text-sm font-semibold tracking-tight">
        <Database className="size-4" />
        {s.title}
      </h3>
      <div className="text-muted-foreground mt-1.5 space-y-1.5 text-[11px] leading-relaxed">
        <p className="flex items-start gap-1.5">
          <Check className="text-emerald-500 mt-0.5 size-3 shrink-0" />
          {s.advantage}
        </p>
        <p>{s.limit}</p>
        <p className="text-muted-foreground/80 italic">{s.serverNote}</p>
      </div>

      {items.length >= EXPORT_REMINDER_THRESHOLD && (
        <p className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300 mt-3 rounded-md border px-2.5 py-1.5 text-[11px]">
          {s.reminder(items.length)}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-3.5" />
          {s.export}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-3.5" />
          {s.import}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-4 border-t pt-3">
        <h4 className="text-foreground text-xs font-semibold">
          {s.measure.title}
        </h4>
        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
          {s.measure.body}
        </p>
        <p className="text-muted-foreground/80 mt-1 text-[11px] leading-relaxed">
          {s.measure.never}
        </p>
      </div>

      {pendingImport && (
        <div className="bg-muted/40 mt-3 rounded-md border p-3">
          <p className="text-foreground text-xs">
            {s.chooseMode(pendingImport.length)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => applyImport("merge")}
            >
              {s.merge}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => applyImport("replace")}
            >
              {s.replace}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPendingImport(null)}
            >
              {s.cancel}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
