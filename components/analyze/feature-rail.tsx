import {
  Gauge,
  AlertTriangle,
  Eye,
  MessageCircleQuestion,
} from "lucide-react";

const ITEMS = [
  {
    icon: Gauge,
    title: "Verdict 0–10",
    body: "One score, one sentence. Apply, caution, or avoid.",
  },
  {
    icon: AlertTriangle,
    title: "Red flags decoded",
    body: '"Fast-paced" → expect overtime. "Family" → boundary issues.',
  },
  {
    icon: Eye,
    title: "Real seniority",
    body: "Junior label asking for 5 years? We catch it.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Smart questions",
    body: "3–5 specific questions to ask the recruiter — not generic.",
  },
];

export function FeatureRail() {
  return (
    <section
      aria-label="What you get"
      className="border-border/70 mt-14 grid gap-y-6 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/60 lg:gap-0"
    >
      {ITEMS.map((item, i) => (
        <div
          key={item.title}
          className={
            "lg:px-5 " + (i === 0 ? "lg:pl-0" : i === ITEMS.length - 1 ? "lg:pr-0" : "")
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
