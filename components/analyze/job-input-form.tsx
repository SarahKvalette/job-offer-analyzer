"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

const SAMPLE = `Senior Full-Stack Engineer @ Acme Inc.

We're a fast-paced startup looking for a rockstar engineer to wear many hats. You'll own everything from frontend to backend in a like-a-family environment. Competitive salary.

Requirements:
- 7+ years of experience with React and Node.js
- Strong knowledge of TypeScript, PostgreSQL, AWS
- Experience leading projects end-to-end
- Bonus: GraphQL, Kubernetes, Terraform

We offer:
- Remote-friendly (Paris HQ, 2 days on-site)
- Stock options
- Modern stack`;

export function JobInputForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");

  const disabled = pending || text.trim().length < 50;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit(text);
      }}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a full job posting here…"
        rows={14}
        className="min-h-[300px] resize-y font-mono text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setText(SAMPLE)}
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
        >
          Try a sample
        </button>
        <Button type="submit" disabled={disabled} size="lg">
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Analyze posting
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
