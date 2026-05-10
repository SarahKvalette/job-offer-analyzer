"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { questionsToText } from "@/lib/export/markdown";
import { t } from "@/lib/i18n";

export function QuestionsList({ questions }: { questions: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!questions.length) return;
    try {
      await navigator.clipboard.writeText(questionsToText(questions));
      setCopied(true);
      toast.success(t.result.questions.copyToast);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.result.questions.copyError);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="size-5" />
          {t.result.questions.title}
        </CardTitle>
        {questions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label={t.result.questions.copyAria}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? t.result.questions.copied : t.result.questions.copy}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t.result.questions.empty}
          </p>
        ) : (
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{q}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
