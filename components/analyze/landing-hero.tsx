export function LandingHero() {
  return (
    <header className="mb-10 sm:mb-12">
      <div className="mono-hint mb-6 flex items-center gap-2">
        <span
          aria-hidden
          className="bg-[color:var(--accent-violet)] inline-block size-1.5 rounded-full"
        />
        LLM-native posting analysis
      </div>

      <h1 className="text-foreground text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-[3.25rem]">
        Decode any tech job posting.
      </h1>

      <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-[1.55]">
        Get a verdict, the real seniority, hidden red flags, and the right
        questions to ask the recruiter — in 10 seconds.
      </p>
    </header>
  );
}
