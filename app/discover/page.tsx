import Link from "next/link";
import { redirect } from "next/navigation";
import { isOwnerSession } from "@/lib/server/owner-auth";
import { isKvConfigured } from "@/lib/server/kv";
import {
  getLastRunAt,
  listOffers,
  listSavedSearches,
} from "@/lib/server/discover";
import { DiscoverFeed } from "@/components/discover/feed";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover · Job Offer Analyzer" };

export default async function DiscoverPage() {
  const owner = await isOwnerSession();
  if (!owner) redirect("/login?next=/discover");

  const kvReady = isKvConfigured();
  const [searches, offers, lastRunAt] = kvReady
    ? await Promise.all([listSavedSearches(), listOffers(), getLastRunAt()])
    : [[], [], null];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.discover.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t.discover.pageSubtitle}
        </p>
        {lastRunAt && (
          <p className="text-muted-foreground mt-1 font-mono text-[11px]">
            {t.discover.lastRun(new Date(lastRunAt).toLocaleString())}
          </p>
        )}
      </header>

      {!kvReady ? (
        <p className="bg-amber-500/5 border-amber-500/30 rounded-md border p-3 text-sm">
          {t.discover.kvMissing}
        </p>
      ) : searches.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            {t.discover.noSearches.title}
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            {t.discover.noSearches.body}
          </p>
          <Link
            href="/"
            className="bg-foreground text-background hover:opacity-90 mt-4 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
          >
            {t.discover.noSearches.cta}
          </Link>
        </div>
      ) : (
        <DiscoverFeed offers={offers} searches={searches} />
      )}
    </div>
  );
}
