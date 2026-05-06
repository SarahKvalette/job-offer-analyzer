import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { HistorySidebar } from "@/components/history/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Sparkles } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Offer Analyzer",
  description:
    "Decode any tech job posting in 10 seconds — real seniority, hidden red flags, the right questions to ask.",
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
          <div className="flex min-h-screen">
            <Suspense fallback={null}>
              <HistorySidebar />
            </Suspense>
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-14 items-center justify-between border-b px-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary size-4" />
                  <span className="text-sm font-medium">
                    Job Offer Analyzer
                  </span>
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 px-6 py-8">{children}</main>
            </div>
          </div>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
