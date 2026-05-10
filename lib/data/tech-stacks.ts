/**
 * Predefined tech stack dataset for the user profile picker.
 *
 * Every entry has a stable `id` (used in stored profile state) and a
 * display `label`. The id format is "category:slug" so the M3 fit-score
 * can match against analysis.skills.required by canonical name.
 *
 * Custom entries the user adds via the picker are stored as
 * "custom:Free label", outside this dataset.
 */

export type TechCategory =
  | "language"
  | "frontend"
  | "backend"
  | "mobile"
  | "data"
  | "devops"
  | "tools";

export interface TechEntry {
  id: string;
  label: string;
  category: TechCategory;
  /** Lowercase aliases used by the search helper. */
  aliases?: readonly string[];
}

export const TECH_STACKS: ReadonlyArray<TechEntry> = [
  // Languages
  { id: "language:typescript", label: "TypeScript", category: "language", aliases: ["ts"] },
  { id: "language:javascript", label: "JavaScript", category: "language", aliases: ["js"] },
  { id: "language:python", label: "Python", category: "language", aliases: ["py"] },
  { id: "language:go", label: "Go", category: "language", aliases: ["golang"] },
  { id: "language:rust", label: "Rust", category: "language" },
  { id: "language:java", label: "Java", category: "language" },
  { id: "language:kotlin", label: "Kotlin", category: "language" },
  { id: "language:swift", label: "Swift", category: "language" },
  { id: "language:csharp", label: "C#", category: "language", aliases: ["c#", "dotnet", ".net"] },
  { id: "language:cpp", label: "C++", category: "language", aliases: ["c++"] },
  { id: "language:ruby", label: "Ruby", category: "language" },
  { id: "language:php", label: "PHP", category: "language" },
  { id: "language:scala", label: "Scala", category: "language" },
  { id: "language:elixir", label: "Elixir", category: "language" },

  // Frontend
  { id: "frontend:react", label: "React", category: "frontend" },
  { id: "frontend:nextjs", label: "Next.js", category: "frontend", aliases: ["next"] },
  { id: "frontend:vue", label: "Vue", category: "frontend", aliases: ["vuejs"] },
  { id: "frontend:nuxt", label: "Nuxt", category: "frontend", aliases: ["nuxtjs"] },
  { id: "frontend:angular", label: "Angular", category: "frontend" },
  { id: "frontend:svelte", label: "Svelte", category: "frontend", aliases: ["sveltekit"] },
  { id: "frontend:remix", label: "Remix", category: "frontend" },
  { id: "frontend:astro", label: "Astro", category: "frontend" },
  { id: "frontend:solid", label: "Solid.js", category: "frontend", aliases: ["solidjs"] },
  { id: "frontend:tailwind", label: "Tailwind CSS", category: "frontend" },
  { id: "frontend:css", label: "CSS / Sass", category: "frontend", aliases: ["sass", "scss"] },
  { id: "frontend:html", label: "HTML", category: "frontend" },
  { id: "frontend:webcomponents", label: "Web Components", category: "frontend" },

  // Backend
  { id: "backend:nodejs", label: "Node.js", category: "backend", aliases: ["node"] },
  { id: "backend:deno", label: "Deno", category: "backend" },
  { id: "backend:bun", label: "Bun", category: "backend" },
  { id: "backend:express", label: "Express", category: "backend" },
  { id: "backend:nestjs", label: "NestJS", category: "backend", aliases: ["nest"] },
  { id: "backend:fastify", label: "Fastify", category: "backend" },
  { id: "backend:django", label: "Django", category: "backend" },
  { id: "backend:fastapi", label: "FastAPI", category: "backend" },
  { id: "backend:flask", label: "Flask", category: "backend" },
  { id: "backend:rails", label: "Rails", category: "backend", aliases: ["ruby on rails", "ror"] },
  { id: "backend:laravel", label: "Laravel", category: "backend" },
  { id: "backend:spring", label: "Spring", category: "backend", aliases: ["spring boot"] },
  { id: "backend:graphql", label: "GraphQL", category: "backend" },
  { id: "backend:trpc", label: "tRPC", category: "backend" },
  { id: "backend:rest", label: "REST APIs", category: "backend" },
  { id: "backend:grpc", label: "gRPC", category: "backend" },

  // Mobile
  { id: "mobile:reactnative", label: "React Native", category: "mobile", aliases: ["rn"] },
  { id: "mobile:flutter", label: "Flutter", category: "mobile" },
  { id: "mobile:swiftui", label: "SwiftUI", category: "mobile" },
  { id: "mobile:jetpackcompose", label: "Jetpack Compose", category: "mobile" },
  { id: "mobile:expo", label: "Expo", category: "mobile" },

  // Data / DB
  { id: "data:postgresql", label: "PostgreSQL", category: "data", aliases: ["postgres"] },
  { id: "data:mysql", label: "MySQL", category: "data" },
  { id: "data:sqlite", label: "SQLite", category: "data" },
  { id: "data:mongodb", label: "MongoDB", category: "data" },
  { id: "data:redis", label: "Redis", category: "data" },
  { id: "data:elasticsearch", label: "Elasticsearch", category: "data" },
  { id: "data:kafka", label: "Kafka", category: "data" },
  { id: "data:snowflake", label: "Snowflake", category: "data" },
  { id: "data:bigquery", label: "BigQuery", category: "data" },
  { id: "data:dbt", label: "dbt", category: "data" },
  { id: "data:airflow", label: "Airflow", category: "data" },
  { id: "data:clickhouse", label: "ClickHouse", category: "data" },
  { id: "data:supabase", label: "Supabase", category: "data" },

  // DevOps / Cloud
  { id: "devops:aws", label: "AWS", category: "devops" },
  { id: "devops:gcp", label: "GCP", category: "devops", aliases: ["google cloud"] },
  { id: "devops:azure", label: "Azure", category: "devops" },
  { id: "devops:vercel", label: "Vercel", category: "devops" },
  { id: "devops:cloudflare", label: "Cloudflare", category: "devops" },
  { id: "devops:kubernetes", label: "Kubernetes", category: "devops", aliases: ["k8s"] },
  { id: "devops:docker", label: "Docker", category: "devops" },
  { id: "devops:terraform", label: "Terraform", category: "devops" },
  { id: "devops:ansible", label: "Ansible", category: "devops" },
  { id: "devops:githubactions", label: "GitHub Actions", category: "devops" },
  { id: "devops:gitlabci", label: "GitLab CI", category: "devops" },
  { id: "devops:jenkins", label: "Jenkins", category: "devops" },

  // Tools
  { id: "tools:git", label: "Git", category: "tools" },
  { id: "tools:figma", label: "Figma", category: "tools" },
  { id: "tools:linear", label: "Linear", category: "tools" },
  { id: "tools:notion", label: "Notion", category: "tools" },
  { id: "tools:slack", label: "Slack", category: "tools" },
  { id: "tools:datadog", label: "Datadog", category: "tools" },
  { id: "tools:sentry", label: "Sentry", category: "tools" },
  { id: "tools:posthog", label: "PostHog", category: "tools" },
  { id: "tools:storybook", label: "Storybook", category: "tools" },
  { id: "tools:playwright", label: "Playwright", category: "tools" },
  { id: "tools:vitest", label: "Vitest", category: "tools" },
  { id: "tools:jest", label: "Jest", category: "tools" },
];

export const CATEGORY_LABELS: Record<TechCategory, string> = {
  language: "Languages",
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  data: "Data & DB",
  devops: "DevOps & Cloud",
  tools: "Tools",
};

const CATEGORY_ORDER: TechCategory[] = [
  "language",
  "frontend",
  "backend",
  "mobile",
  "data",
  "devops",
  "tools",
];

/** Strip diacritics + lowercase for accent-insensitive matching. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Search the dataset by label or alias. Returns matching entries grouped
 * by category in the canonical order. An empty query returns the whole
 * dataset grouped.
 */
export function searchStacks(query: string): Array<{
  category: TechCategory;
  label: string;
  entries: TechEntry[];
}> {
  const q = normalise(query.trim());
  const filtered = q.length === 0
    ? TECH_STACKS
    : TECH_STACKS.filter((entry) => {
        if (normalise(entry.label).includes(q)) return true;
        if (entry.aliases?.some((a) => normalise(a).includes(q))) return true;
        return false;
      });

  const grouped: Record<TechCategory, TechEntry[]> = {
    language: [],
    frontend: [],
    backend: [],
    mobile: [],
    data: [],
    devops: [],
    tools: [],
  };
  for (const entry of filtered) grouped[entry.category].push(entry);

  return CATEGORY_ORDER.filter((c) => grouped[c].length > 0).map((c) => ({
    category: c,
    label: CATEGORY_LABELS[c],
    entries: grouped[c],
  }));
}

/** Look up an entry by id (returns null for ids not in the dataset). */
export function findStackById(id: string): TechEntry | null {
  return TECH_STACKS.find((e) => e.id === id) ?? null;
}

/**
 * Display label for a stored stack id. Custom entries follow the
 * "custom:Foo Bar" convention and are returned as-is (without the
 * "custom:" prefix).
 */
export function labelFor(id: string): string {
  if (id.startsWith("custom:")) return id.slice("custom:".length);
  return findStackById(id)?.label ?? id;
}
