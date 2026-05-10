import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { t } from "@/lib/i18n";

export const metadata = { title: "Stats · Job Offer Analyzer" };

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.stats.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t.stats.pageSubtitle}
        </p>
      </header>
      <StatsDashboard />
    </div>
  );
}
