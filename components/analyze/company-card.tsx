import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  TrendingUp,
  Wallet,
  Sparkles,
  Layers,
  Quote,
} from "lucide-react";
import type { JobAnalysis } from "@/lib/schemas/analysis";
import { t } from "@/lib/i18n";

const sizeLabel: Record<
  NonNullable<JobAnalysis["company"]>["sizeEstimate"],
  { label: string; hint: string }
> = {
  startup: { label: t.result.company.sizeLabels.startup, hint: t.result.company.sizeHints.startup },
  scaleup: { label: t.result.company.sizeLabels.scaleup, hint: t.result.company.sizeHints.scaleup },
  midsize: { label: t.result.company.sizeLabels.midsize, hint: t.result.company.sizeHints.midsize },
  enterprise: { label: t.result.company.sizeLabels.enterprise, hint: t.result.company.sizeHints.enterprise },
  unknown: { label: t.result.company.sizeLabels.unknown, hint: t.result.company.sizeHints.unknown },
};

export function CompanyCard({
  company,
}: {
  company: NonNullable<JobAnalysis["company"]>;
}) {
  const size = sizeLabel[company.sizeEstimate];
  const hasAnyDetail =
    !!company.industry ||
    !!company.stage ||
    !!company.funding ||
    company.sizeEstimate !== "unknown";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5" />
          {t.result.company.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasAnyDetail && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              icon={<Users className="size-4" />}
              label={t.result.company.sizeLabel}
              value={size.label}
              hint={size.hint}
            />
            {company.industry && (
              <Stat
                icon={<Layers className="size-4" />}
                label={t.result.company.industryLabel}
                value={company.industry}
              />
            )}
            {company.stage && (
              <Stat
                icon={<TrendingUp className="size-4" />}
                label={t.result.company.stageLabel}
                value={company.stage}
              />
            )}
            {company.funding && (
              <Stat
                icon={<Wallet className="size-4" />}
                label={t.result.company.fundingLabel}
                value={company.funding}
              />
            )}
          </div>
        )}

        {company.techStack.length > 0 && (
          <section>
            <h3 className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">
              {t.result.company.techStack}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {company.techStack.map((t) => (
                <li key={t}>
                  <Badge variant="outline" className="font-mono text-xs">
                    {t}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {company.perks.length > 0 && (
          <section>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Sparkles className="size-3" /> {t.result.company.perks}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {company.perks.map((p) => (
                <li key={p}>
                  <Badge variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {company.cultureSignals.length > 0 && (
          <section>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Quote className="size-3" /> {t.result.company.cultureSignals}
            </h3>
            <ul className="space-y-2">
              {company.cultureSignals.map((s) => (
                <li
                  key={s.phrase + s.meaning}
                  className="bg-muted/40 rounded-md border px-3 py-2"
                >
                  <p className="text-foreground/90 text-sm italic">
                    “{s.phrase}”
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {s.meaning}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-muted/30 flex items-start gap-2.5 rounded-md border px-3 py-2.5">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-foreground text-sm font-medium leading-tight">
          {value}
        </p>
        {hint && (
          <p className="text-muted-foreground text-xs">{hint}</p>
        )}
      </div>
    </div>
  );
}
