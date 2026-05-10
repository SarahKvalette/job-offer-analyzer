import { LoginForm } from "@/components/auth/login-form";
import { t } from "@/lib/i18n";

export const metadata = { title: "Sign in · Job Offer Analyzer" };

export default function LoginPage() {
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
      <LoginForm />
    </div>
  );
}
