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

const sizeLabel: Record<
  NonNullable<JobAnalysis["company"]>["sizeEstimate"],
  { label: string; hint: string }
> = {
  startup: { label: "Startup", hint: "< 50 people" },
  scaleup: { label: "Scale-up", hint: "50–500 people" },
  midsize: { label: "Mid-size", hint: "500–5k people" },
  enterprise: { label: "Enterprise", hint: "5k+ people" },
  unknown: { label: "Size unknown", hint: "not stated" },
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
          About the company
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasAnyDetail && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              icon={<Users className="size-4" />}
              label="Size"
              value={size.label}
              hint={size.hint}
            />
            {company.industry && (
              <Stat
                icon={<Layers className="size-4" />}
                label="Industry"
                value={company.industry}
              />
            )}
            {company.stage && (
              <Stat
                icon={<TrendingUp className="size-4" />}
                label="Stage"
                value={company.stage}
              />
            )}
            {company.funding && (
              <Stat
                icon={<Wallet className="size-4" />}
                label="Funding"
                value={company.funding}
              />
            )}
          </div>
        )}

        {company.techStack.length > 0 && (
          <section>
            <h3 className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">
              Tech stack
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
              <Sparkles className="size-3" /> Perks mentioned
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
              <Quote className="size-3" /> Culture signals
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
