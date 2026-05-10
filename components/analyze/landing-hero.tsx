import { t } from "@/lib/i18n";

export function LandingHero() {
  return (
    <header className="mb-10 sm:mb-12">
      <div className="mono-hint mb-6 flex items-center gap-2">
        <span
          aria-hidden
          className="bg-[color:var(--accent-violet)] inline-block size-1.5 rounded-full"
        />
        {t.landing.eyebrow}
      </div>

      <h1 className="text-foreground text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-[3.25rem]">
        {t.landing.title}
      </h1>

      <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-[1.55]">
        {t.landing.subtitle}
      </p>
    </header>
  );
}
