"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Radar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TagInput } from "./tag-input";
import { t } from "@/lib/i18n";
import type { SavedSearch, SavedSearchPatch } from "@/lib/schemas/discover";

type ApiState = {
  searches: SavedSearch[];
  kvConfigured: boolean;
  sources: { remotive: boolean; francetravail: boolean };
};

type ApiError = { error: { code: string; message: string } };

const REMOTE_OPTIONS: Array<{ value: SavedSearch["remote"]; label: string }> = [
  { value: "any", label: t.discover.remote.any },
  { value: "only", label: t.discover.remote.only },
  { value: "no", label: t.discover.remote.no },
];

export function SearchesSection() {
  const [state, setState] = useState<ApiState | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/searches", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ApiState;
      setState(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: t.discover.newSearchLabel }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? "Could not create search.");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create search.");
    } finally {
      setCreating(false);
    }
  };

  if (!state) {
    return (
      <section>
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {t.discover.sectionTitle}
        </h3>
        <p className="text-muted-foreground mt-2 text-xs">…</p>
      </section>
    );
  }

  if (!state.kvConfigured) {
    return (
      <section>
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {t.discover.sectionTitle}
        </h3>
        <p className="bg-amber-500/5 border-amber-500/30 mt-3 rounded-md border p-2.5 text-[11px]">
          {t.discover.kvMissing}
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {t.discover.sectionTitle}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          {t.discover.addSearch}
        </Button>
      </div>
      <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
        {t.discover.sectionHint}
      </p>

      {!state.sources.francetravail && (
        <p className="bg-amber-500/5 border-amber-500/30 mt-3 rounded-md border p-2.5 text-[11px]">
          {t.discover.ftUnconfigured}
        </p>
      )}

      {state.searches.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-xs italic">
          {t.discover.empty}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {state.searches.map((search) => (
            <SearchEditor
              key={search.id}
              search={search}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SearchEditor({
  search,
  onChanged,
}: {
  search: SavedSearch;
  onChanged: () => Promise<void>;
}) {
  // Parent keys this editor by `search.id` so we get a fresh draft state
  // whenever a different search lands here — no effect-driven sync needed.
  const [draft, setDraft] = useState<SavedSearch>(search);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patch = async (body: SavedSearchPatch) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/searches/${search.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? "Save failed.");
      }
      const next = (await res.json()) as SavedSearch;
      setDraft(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/searches/${search.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error?.message ?? "Delete failed.");
      }
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  };

  const toggleSource = (source: "remotive" | "francetravail") => {
    const next = draft.sources.includes(source)
      ? draft.sources.filter((s) => s !== source)
      : [...draft.sources, source];
    if (next.length === 0) return; // Always at least one source.
    patch({ sources: next });
  };

  return (
    <div className="border-border bg-card/50 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          onBlur={() => {
            if (draft.label !== search.label) patch({ label: draft.label });
          }}
          className="text-foreground bg-transparent text-sm font-medium outline-none"
          aria-label={t.discover.labelAria}
        />
        <div className="flex items-center gap-1">
          {saving && <Loader2 className="text-muted-foreground size-3 animate-spin" />}
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            aria-label={t.discover.deleteAria}
            className="text-muted-foreground hover:text-destructive rounded p-1"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">
            {t.discover.keywordsLabel}
          </label>
          <TagInput
            value={draft.keywords}
            onChange={(v) => patch({ keywords: v })}
            placeholder={t.discover.keywordsPlaceholder}
          />
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">
            {t.discover.excludeLabel}
          </label>
          <TagInput
            value={draft.excludeKeywords}
            onChange={(v) => patch({ excludeKeywords: v })}
            placeholder={t.discover.excludePlaceholder}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">
              {t.discover.remoteLabel}
            </label>
            <select
              value={draft.remote}
              onChange={(e) =>
                patch({ remote: e.target.value as SavedSearch["remote"] })
              }
              className="bg-card border-input w-full rounded-md border px-2 py-1.5 text-sm outline-none"
            >
              {REMOTE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">
              {t.discover.minSalaryLabel}
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={draft.minSalaryEUR ?? ""}
              onChange={(e) => {
                const num = e.target.value === "" ? null : Number(e.target.value);
                setDraft({ ...draft, minSalaryEUR: num });
              }}
              onBlur={() => {
                if (draft.minSalaryEUR !== search.minSalaryEUR) {
                  patch({ minSalaryEUR: draft.minSalaryEUR });
                }
              }}
              placeholder="65000"
              className="bg-card border-input w-full rounded-md border px-2 py-1.5 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">
            {t.discover.locationsLabel}
          </label>
          <TagInput
            value={draft.locations}
            onChange={(v) => patch({ locations: v })}
            placeholder={t.discover.locationsPlaceholder}
            hint={t.discover.locationsHint}
          />
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wider">
            {t.discover.sourcesLabel}
          </label>
          <div className="flex gap-3">
            <label className="text-foreground inline-flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={draft.sources.includes("francetravail")}
                onChange={() => toggleSource("francetravail")}
                className="size-3.5 rounded"
              />
              France Travail
            </label>
            <label className="text-foreground inline-flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={draft.sources.includes("remotive")}
                onChange={() => toggleSource("remotive")}
                className="size-3.5 rounded"
              />
              Remotive
            </label>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground mt-3 flex items-center gap-1 text-[11px]">
        <Radar className="size-3" />
        <a
          href="/discover"
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          {t.discover.viewMatches}
        </a>
      </div>
    </div>
  );
}
