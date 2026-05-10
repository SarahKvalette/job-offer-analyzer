import type { JobAnalysis, StoredAnalysis } from "@/lib/schemas/analysis";
import { computeFallbackVerdict } from "@/lib/analysis/verdict";

export function analysisToMarkdown(entry: StoredAnalysis): string {
  const a = entry.analysis;
  const verdict = a.verdict ?? computeFallbackVerdict(a);
  const lines: string[] = [];
  lines.push(`# ${a.meta.title}`);
  if (a.meta.company) lines.push(`**${a.meta.company}**`);
  lines.push("");
  lines.push(`## Verdict — ${verdict.score}/10 (${verdict.sentiment.toUpperCase()})`);
  lines.push(`> ${verdict.oneLiner}`);
  lines.push("");
  lines.push("## Meta");
  lines.push(`- Location: ${a.meta.location ?? "—"}`);
  lines.push(`- Remote: ${a.meta.remote}`);
  lines.push(`- Contract: ${a.meta.contractType ?? "—"}`);
  lines.push(`- Seniority (announced): ${a.meta.seniorityAnnounced}`);
  if (a.meta.salaryRange) {
    lines.push(
      `- Salary: ${a.meta.salaryRange.min}–${a.meta.salaryRange.max} ${a.meta.salaryRange.currency}`
    );
  }
  lines.push("");
  if (a.company) {
    lines.push("## Company");
    lines.push(`- Size: ${a.company.sizeEstimate}`);
    if (a.company.industry) lines.push(`- Industry: ${a.company.industry}`);
    if (a.company.stage) lines.push(`- Stage: ${a.company.stage}`);
    if (a.company.funding) lines.push(`- Funding: ${a.company.funding}`);
    if (a.company.techStack.length)
      lines.push(`- Tech stack: ${a.company.techStack.join(", ")}`);
    if (a.company.perks.length)
      lines.push(`- Perks: ${a.company.perks.join(", ")}`);
    lines.push("");
  }
  lines.push("## Reality check");
  lines.push(
    `**Real seniority:** ${a.realityCheck.seniorityRealVsAnnounced.real}`
  );
  lines.push(a.realityCheck.seniorityRealVsAnnounced.reasoning);
  lines.push("");
  if (a.realityCheck.redFlags.length) {
    lines.push("### 🚩 Red flags");
    for (const f of a.realityCheck.redFlags) {
      lines.push(`- _"${f.phrase}"_ — **${f.severity}** — ${f.translation}`);
    }
    lines.push("");
  }
  if (a.realityCheck.greenFlags.length) {
    lines.push("### ✅ Green flags");
    for (const f of a.realityCheck.greenFlags) {
      lines.push(`- _"${f.phrase}"_ — ${f.why}`);
    }
    lines.push("");
  }
  lines.push("## Skills");
  if (a.skills.required.length) {
    lines.push(`**Required:** ${a.skills.required.map((s) => s.name).join(", ")}`);
  }
  if (a.skills.niceToHave.length) {
    lines.push(
      `**Nice to have:** ${a.skills.niceToHave.map((s) => s.name).join(", ")}`
    );
  }
  if (a.skills.impliedButUnstated.length) {
    lines.push(
      `**Implied:** ${a.skills.impliedButUnstated.map((s) => s.name).join(", ")}`
    );
  }
  lines.push("");
  lines.push("## Questions to ask the recruiter");
  a.questionsToAsk.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  return lines.join("\n");
}

export function questionsToText(questions: string[]): string {
  return questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileSlug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "analysis"
  );
}

export type { JobAnalysis };
