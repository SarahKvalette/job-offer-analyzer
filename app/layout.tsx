import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { HistoryDrawer } from "@/components/history/drawer";
import { ProfileDrawer } from "@/components/profile/drawer";
import { CommandPalette } from "@/components/palette/command-palette";
import { Toaster } from "@/components/ui/sonner";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { LayoutGrid, BarChart3, Radar } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b px-6">
              <Link
                href="/"
                aria-label={t.header.appName}
                className="hover:opacity-80 flex items-center gap-2.5 transition-opacity"
              >
                <div className="relative flex size-6 items-center justify-center">
                  <span
                    aria-hidden
                    className="bg-foreground absolute inset-0 rounded-md"
                  />
                  <span
                    aria-hidden
                    className="text-background relative font-mono text-[11px] font-bold leading-none"
                  >
                    /j
                  </span>
                </div>
                <span className="text-sm font-medium tracking-tight">
                  {t.header.appName}
                </span>
                <span className="text-muted-foreground border-border ml-1 hidden rounded-md border px-1.5 py-0.5 font-mono text-[10px] sm:block">
                  {t.header.version}
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="/pipeline"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors"
                >
                  <LayoutGrid className="size-4" />
                  <span className="hidden sm:inline">
                    {t.pipeline.triggerLabel}
                  </span>
                </Link>
                <Link
                  href="/discover"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors"
                >
                  <Radar className="size-4" />
                  <span className="hidden sm:inline">
                    {t.discover.triggerLabel}
                  </span>
                </Link>
                <Link
                  href="/stats"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors"
                >
                  <BarChart3 className="size-4" />
                  <span className="hidden sm:inline">Stats</span>
                </Link>
                <CommandPalette />
                <ProfileDrawer />
                <Suspense fallback={null}>
                  <HistoryDrawer />
                </Suspense>
                <ThemeToggle />
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
              {children}
            </main>
          </div>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
