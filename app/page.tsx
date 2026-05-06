import { Suspense } from "react";
import { AnalysisShell } from "@/components/analyze/analysis-shell";

type SearchParams = Promise<{ id?: string | string[] }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  return (
    <Suspense fallback={null}>
      <AnalysisShell initialId={id ?? null} />
    </Suspense>
  );
}
