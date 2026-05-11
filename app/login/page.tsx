import { LoginForm } from "@/components/auth/login-form";
import { t } from "@/lib/i18n";

export const metadata = { title: "Sign in · Job Offer Analyzer" };

type SearchParams = Promise<{
  next?: string | string[];
  google_error?: string | string[];
}>;

function single(v: string | string[] | undefined): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next = single(params.next) ?? "/";
  const error = single(params.google_error);

  // Only allow same-origin redirects.
  const safeNext = next.startsWith("/") ? next : "/";

  return (
    <div className="mx-auto max-w-md pt-8">
      <header className="mb-8">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {t.auth.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t.auth.pageSubtitle}
        </p>
      </header>
      <LoginForm nextPath={safeNext} initialError={error} />
    </div>
  );
}
