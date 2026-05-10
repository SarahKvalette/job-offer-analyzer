import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobAnalysis } from "@/lib/schemas/analysis";
import { Building2, MapPin, BriefcaseBusiness, Banknote, Wifi } from "lucide-react";
import { t } from "@/lib/i18n";

const remoteLabel = t.result.meta.remoteLabels;
const seniorityLabel = t.result.meta.seniorityLabels;

function formatSalary(range: JobAnalysis["meta"]["salaryRange"]): string | null {
  if (!range) return null;
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${fmt.format(range.min)}–${fmt.format(range.max)} ${range.currency}`;
}

export function MetaCard({ meta }: { meta: JobAnalysis["meta"] }) {
  const salary = formatSalary(meta.salaryRange);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{meta.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">{seniorityLabel[meta.seniorityAnnounced]}</Badge>
          <Badge variant="outline">{remoteLabel[meta.remote]}</Badge>
          {meta.contractType ? (
            <Badge variant="outline">{meta.contractType}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="text-muted-foreground grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <MetaRow icon={<Building2 className="size-4" />} label={t.result.meta.company} value={meta.company} />
          <MetaRow icon={<MapPin className="size-4" />} label={t.result.meta.location} value={meta.location} />
          <MetaRow icon={<Wifi className="size-4" />} label={t.result.meta.remote} value={remoteLabel[meta.remote]} />
          <MetaRow icon={<BriefcaseBusiness className="size-4" />} label={t.result.meta.contract} value={meta.contractType} />
          <MetaRow icon={<Banknote className="size-4" />} label={t.result.meta.salary} value={salary} />
        </dl>
      </CardContent>
    </Card>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="text-foreground/80 text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="text-foreground ml-auto truncate text-sm">
        {value ?? "—"}
      </span>
    </div>
  );
}
