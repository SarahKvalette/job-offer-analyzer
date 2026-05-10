import { Suspense } from "react";
import { CompareTable } from "@/components/compare/compare-table";
import { t } from "@/lib/i18n";

export const metadata = { title: "Compare · Job Offer Analyzer" };

type SearchParams = Promise<{ ids?: string | string[] }>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = params.ids;
  const idsString = Array.isArray(raw) ? raw[0] : raw;
  const ids = (idsString ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.compare.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t.compare.pageSubtitle}
        </p>
      </header>
      <Suspense fallback={null}>
        <CompareTable ids={ids} />
      </Suspense>
    </div>
  );
}
