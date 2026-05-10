import { Kanban } from "@/components/application/kanban";
import { RemindersBanner } from "@/components/application/reminders-banner";
import { GmailScanPanel } from "@/components/application/gmail-scan-panel";
import { t } from "@/lib/i18n";

export const metadata = { title: "Pipeline · Job Offer Analyzer" };

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.pipeline.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t.pipeline.pageSubtitle}
        </p>
      </header>
      <RemindersBanner />
      <GmailScanPanel />
      <Kanban />
    </div>
  );
}
