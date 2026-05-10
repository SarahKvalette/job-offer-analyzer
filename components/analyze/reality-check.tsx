"use client";

import { AlertTriangle, ShieldCheck, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEvidenceHandlers } from "@/components/analyze/highlight-context";
import type { JobAnalysis } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const severityStyles: Record<
  JobAnalysis["realityCheck"]["redFlags"][number]["severity"],
  string
> = {
  low: "border-amber-500/40 bg-amber-500/5",
  medium: "border-orange-500/50 bg-orange-500/10",
  high: "border-red-500/60 bg-red-500/10",
};

const severityLabel = t.result.realityCheck.severity;
const seniorityLabel = (() => {
  // staff label has "+" appended, mapped from meta seniority labels
  const m = t.result.meta.seniorityLabels;
  return {
    junior: m.junior,
    mid: m.mid,
    senior: m.senior,
    staff: m.staff,
  } as const;
})();

export function RealityCheck({
  realityCheck,
}: {
  realityCheck: JobAnalysis["realityCheck"];
}) {
  const { redFlags, greenFlags, seniorityRealVsAnnounced } = realityCheck;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.result.realityCheck.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <header className="mb-3 flex items-center gap-2">
            <Gauge className="size-4" />
            <h3 className="text-sm font-medium">
              {t.result.realityCheck.realSeniorityLabel}
            </h3>
            <Badge variant="secondary">
              {seniorityLabel[seniorityRealVsAnnounced.real]}
            </Badge>
          </header>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {seniorityRealVsAnnounced.reasoning}
          </p>
        </section>

        <section>
          <header className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h3 className="text-sm font-medium">
              {t.result.realityCheck.redFlagsLabel}
            </h3>
            <span className="text-muted-foreground text-xs">
              {redFlags.length}
            </span>
          </header>
          {redFlags.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t.result.realityCheck.noneSpotted}
            </p>
          ) : (
            <ul className="space-y-2">
              {redFlags.map((flag) => (
                <RedFlagItem key={flag.phrase + flag.translation} flag={flag} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <header className="mb-3 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-500" />
            <h3 className="text-sm font-medium">
              {t.result.realityCheck.greenFlagsLabel}
            </h3>
            <span className="text-muted-foreground text-xs">
              {greenFlags.length}
            </span>
          </header>
          {greenFlags.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t.result.realityCheck.noneSpotted}
            </p>
          ) : (
            <ul className="space-y-2">
              {greenFlags.map((flag) => (
                <GreenFlagItem key={flag.phrase + flag.why} flag={flag} />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function RedFlagItem({
  flag,
}: {
  flag: JobAnalysis["realityCheck"]["redFlags"][number];
}) {
  const handlers = useEvidenceHandlers(flag.phrase);
  return (
    <li
      tabIndex={0}
      className={cn(
        "rounded-md border p-3 transition-colors",
        severityStyles[flag.severity]
      )}
      {...handlers}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground/90 text-sm italic">“{flag.phrase}”</p>
        <Badge variant="outline" className="shrink-0">
          {severityLabel[flag.severity]}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{flag.translation}</p>
    </li>
  );
}

function GreenFlagItem({
  flag,
}: {
  flag: JobAnalysis["realityCheck"]["greenFlags"][number];
}) {
  const handlers = useEvidenceHandlers(flag.phrase);
  return (
    <li
      tabIndex={0}
      className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 transition-colors"
      {...handlers}
    >
      <p className="text-foreground/90 text-sm italic">“{flag.phrase}”</p>
      <p className="text-muted-foreground mt-1 text-xs">{flag.why}</p>
    </li>
  );
}
