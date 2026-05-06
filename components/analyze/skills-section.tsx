"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvidenceHandlers } from "@/components/analyze/highlight-context";
import type { JobAnalysis } from "@/lib/schemas/analysis";

type SkillItem = { name: string; evidence: string };

export function SkillsSection({ skills }: { skills: JobAnalysis["skills"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <SkillGroup label="Required" tone="default" items={skills.required} />
        <SkillGroup
          label="Nice to have"
          tone="secondary"
          items={skills.niceToHave}
        />
        <ImpliedGroup items={skills.impliedButUnstated} />
      </CardContent>
    </Card>
  );
}

function SkillGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "default" | "secondary";
  items: SkillItem[];
}) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">
        {label}
      </h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">—</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <SkillBadge key={item.name + item.evidence} item={item} tone={tone} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SkillBadge({
  item,
  tone,
}: {
  item: SkillItem;
  tone: "default" | "secondary";
}) {
  const handlers = useEvidenceHandlers(item.evidence);
  return (
    <li>
      <Badge
        variant={tone}
        tabIndex={0}
        className="cursor-help"
        title={`“${item.evidence}”`}
        {...handlers}
      >
        {item.name}
      </Badge>
    </li>
  );
}

function ImpliedGroup({
  items,
}: {
  items: JobAnalysis["skills"]["impliedButUnstated"];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">
        Implied (not stated)
      </h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.name + item.reason}>
            <Badge
              variant="outline"
              tabIndex={0}
              className="cursor-help"
              title={item.reason}
            >
              {item.name}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
