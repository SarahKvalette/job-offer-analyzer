"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { SavedSearch, StoredOffer } from "@/lib/schemas/discover";

/**
 * Client-side feed renderer. Groups offers into "today" vs "earlier"
 * buckets, lets the owner filter by saved search, and provides a 1-click
 * jump back to the analyser by encoding the offer description into the
 * URL hash (same pattern as the Chrome extension's `#analyze=…`).
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const TODAY_WINDOW_MS = 36 * 60 * 60 * 1000; // 36h — anything fetched in this window counts as "new".

function relative(timestamp: number, now: number): string {
  const diff = now - timestamp;
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60_000))}m ago`;
  if (diff < DAY_MS) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / DAY_MS)}d ago`;
}

function offerToAnalyzeHash(offer: StoredOffer): string {
  const text = `${offer.title}\n\n${offer.company} · ${offer.location}\n${offer.url}\n\n${offer.description}`;
  return `#analyze=${encodeURIComponent(text)}`;
}

export function DiscoverFeed({
  offers,
  searches,
}: {
  offers: StoredOffer[];
  searches: SavedSearch[];
}) {
  const [selectedSearchId, setSelectedSearchId] = useState<string>("all");
  // Snapshot "now" once on mount — the "today" cutoff and "X hours ago"
  // labels shouldn't shift mid-render. Refreshed once per minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (selectedSearchId === "all") return offers;
    return offers.filter((o) => o.matchedSearchIds.includes(selectedSearchId));
  }, [offers, selectedSearchId]);

  const { today, earlier } = useMemo(() => {
    const cutoff = now - TODAY_WINDOW_MS;
    return {
      today: filtered.filter((o) => o.fetchedAt >= cutoff),
      earlier: filtered.filter((o) => o.fetchedAt < cutoff),
    };
  }, [filtered, now]);

  const searchById = useMemo(
    () => new Map(searches.map((s) => [s.id, s])),
    [searches]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={selectedSearchId === "all"}
          onClick={() => setSelectedSearchId("all")}
          label={`All · ${offers.length}`}
        />
        {searches.map((s) => {
          const count = offers.filter((o) =>
            o.matchedSearchIds.includes(s.id)
          ).length;
          return (
            <FilterChip
              key={s.id}
              active={selectedSearchId === s.id}
              onClick={() => setSelectedSearchId(s.id)}
              label={`${s.label} · ${count}`}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            {t.discover.emptyTitle}
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            {t.discover.emptyBody}
          </p>
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <Section
              title="Today"
              offers={today}
              isNew
              searchById={searchById}
              now={now}
            />
          )}
          {earlier.length > 0 && (
            <Section
              title="Earlier"
              offers={earlier}
              isNew={false}
              searchById={searchById}
              now={now}
            />
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  offers,
  isNew,
  searchById,
  now,
}: {
  title: string;
  offers: StoredOffer[];
  isNew: boolean;
  searchById: Map<string, SavedSearch>;
  now: number;
}) {
  return (
    <section>
      <h2 className="text-muted-foreground mb-3 font-mono text-[11px] font-medium uppercase tracking-wider">
        {title} · {offers.length}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            isNew={isNew}
            searchById={searchById}
            now={now}
          />
        ))}
      </div>
    </section>
  );
}

function OfferCard({
  offer,
  isNew,
  searchById,
  now,
}: {
  offer: StoredOffer;
  isNew: boolean;
  searchById: Map<string, SavedSearch>;
  now: number;
}) {
  const matchedLabels = offer.matchedSearchIds
    .map((id) => searchById.get(id)?.label)
    .filter((s): s is string => Boolean(s));

  const sourceLabel = offer.source === "francetravail" ? "France Travail" : "Remotive";

  const salaryLine = offer.salaryText
    ? offer.salaryText
    : offer.salaryMinEUR
      ? `${offer.salaryMinEUR.toLocaleString()} €${offer.salaryMaxEUR && offer.salaryMaxEUR !== offer.salaryMinEUR ? ` – ${offer.salaryMaxEUR.toLocaleString()} €` : ""}`
      : null;

  return (
    <article className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-sm font-semibold tracking-tight">
            {offer.title}
          </h3>
          <p className="text-muted-foreground truncate text-xs">
            {offer.company}
          </p>
        </div>
        {isNew && (
          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider">
            {t.discover.offerCard.newToday}
          </span>
        )}
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {offer.location}
        </span>
        {offer.remote && (
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3" />
            {t.discover.offerCard.remote}
          </span>
        )}
        <span>· {relative(offer.publishedAt, now)}</span>
      </div>

      {salaryLine && (
        <p className="text-foreground text-xs font-medium">{salaryLine}</p>
      )}

      <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
        {offer.description}
      </p>

      {matchedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {matchedLabels.map((label) => (
            <span
              key={label}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="text-muted-foreground mt-1 flex items-center justify-between text-[11px]">
        <span>
          {t.discover.offerCard.viaSource} {sourceLabel}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            {t.discover.offerCard.openOriginal}
            <ExternalLink className="size-3" />
          </a>
          <a
            href={`/${offerToAnalyzeHash(offer)}`}
            className="text-foreground bg-muted hover:bg-muted/80 rounded px-2 py-0.5 font-medium"
          >
            {t.discover.offerCard.analyse}
          </a>
        </div>
      </div>
    </article>
  );
}
