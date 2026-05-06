import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircleQuestion } from "lucide-react";

export function QuestionsList({ questions }: { questions: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="size-5" />
          Questions to ask
        </CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No questions surfaced.</p>
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
