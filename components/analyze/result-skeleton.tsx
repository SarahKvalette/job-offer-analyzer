"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const MESSAGES = [
  "Reading the posting…",
  "Spotting red flags…",
  "Cross-checking real seniority…",
  "Listing the unsaid skills…",
  "Drafting the right questions…",
  "Almost there — finalizing the verdict…",
];

export function ResultSkeleton() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <Loader2 className="text-primary size-5 animate-spin" />
          <div className="min-w-0 flex-1">
            <p
              key={idx}
              className="text-foreground animate-in fade-in slide-in-from-bottom-1 text-sm font-medium duration-500"
            >
              {MESSAGES[idx]}
            </p>
            <div className="bg-muted mt-2 h-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-700"
                style={{
                  width: `${((idx + 1) / MESSAGES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-3/4" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}
