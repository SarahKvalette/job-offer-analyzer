import {
  Gauge,
  AlertTriangle,
  Eye,
  MessageCircleQuestion,
} from "lucide-react";
import { t } from "@/lib/i18n";

const ITEMS = [
  { icon: Gauge, ...t.features.verdict },
  { icon: AlertTriangle, ...t.features.redFlags },
  { icon: Eye, ...t.features.seniority },
  { icon: MessageCircleQuestion, ...t.features.questions },
];

export function FeatureRail() {
  return (
    <section
      aria-label={t.features.sectionAriaLabel}
      className="border-border/70 mt-14 grid gap-y-6 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/60 lg:gap-0"
    >
      {ITEMS.map((item, i) => (
        <div
          key={item.title}
          className={
            "lg:px-5 " +
            (i === 0 ? "lg:pl-0" : i === ITEMS.length - 1 ? "lg:pr-0" : "")
          }
        >
          <item.icon
            className="text-muted-foreground mb-3 size-[18px]"
            strokeWidth={1.75}
          />
          <p className="text-foreground text-sm font-medium tracking-tight">
            {item.title}
          </p>
          <p className="text-muted-foreground mt-1.5 text-[13px] leading-[1.55]">
            {item.body}
          </p>
        </div>
      ))}
    </section>
  );
}
