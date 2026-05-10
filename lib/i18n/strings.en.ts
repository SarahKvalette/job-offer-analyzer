/**
 * Centralised UI strings (English).
 *
 * One file, one source of truth. To add a French (or any other) locale later:
 *   1. Duplicate this file as `strings.fr.ts` keeping the same shape
 *   2. Pick the active dictionary in `lib/i18n/index.ts` based on a context/cookie
 *
 * Note: this only covers UI chrome. The LLM analysis output is generated in
 * the same language as the source posting (handled in the prompt).
 */

export const strings = {
  meta: {
    title: "Job Offer Analyzer",
    description:
      "Decode any tech job posting in 10 seconds — real seniority, hidden red flags, the right questions to ask.",
  },
  header: {
    appName: "Job Offer Analyzer",
    version: "v0.1",
    history: "History",
    openHistory: "Open history",
  },
  landing: {
    eyebrow: "LLM-native posting analysis",
    title: "Decode any tech job posting.",
    subtitle:
      "Get a verdict, the real seniority, hidden red flags, and the right questions to ask the recruiter — in 10 seconds.",
    privacyHint: "Stored locally · Nothing shared · ⌘ + Enter to submit",
  },
  features: {
    verdict: {
      title: "Verdict 0–10",
      body: "One score, one sentence. Apply, caution, or avoid.",
    },
    redFlags: {
      title: "Red flags decoded",
      body: '"Fast-paced" → expect overtime. "Family" → boundary issues.',
    },
    seniority: {
      title: "Real seniority",
      body: "Junior label asking for 5 years? We catch it.",
    },
    questions: {
      title: "Smart questions",
      body: "3–5 specific questions to ask the recruiter — not generic.",
    },
    sectionAriaLabel: "What you get",
  },
  form: {
    placeholder: "Paste a tech job posting, or drop a PDF here.",
    sample: "Sample",
    pdfButton: "PDF",
    removePdf: "Remove PDF",
    dropPdf: "Drop PDF to extract",
    analyze: "Analyze",
    analyzing: "Analyzing",
    newAnalysis: "New analysis",
    minChars: (current: number, min: number) => `${current} / ${min}`,
    maxChars: (current: number, max: number) =>
      `${current.toLocaleString()} / ${max.toLocaleString()} — too long`,
    chars: (current: number) => `${current.toLocaleString()}`,
    pdf: {
      extractedToast: "PDF text extracted — review and analyze.",
      onlyPdfError: "Drop a PDF file (or paste text directly).",
      extractFailed: "PDF extraction failed.",
    },
  },
  loading: {
    messages: [
      "Reading the posting…",
      "Spotting red flags…",
      "Cross-checking real seniority…",
      "Listing the unsaid skills…",
      "Drafting the right questions…",
      "Almost there — finalizing the verdict…",
    ],
  },
  result: {
    verdict: {
      eyebrow: "overall verdict",
      copy: "Copy",
      copied: "Copied",
      copyAria: "Copy as markdown",
      copyToast: "Analysis copied as Markdown",
      copyError: "Couldn't copy to clipboard",
      export: "Export",
      exportAria: "Download as markdown",
    },
    sentiment: {
      apply: "Apply",
      caution: "Caution",
      avoid: "Avoid",
    },
    realityCheck: {
      title: "Reality check",
      realSeniorityLabel: "Real seniority",
      redFlagsLabel: "Red flags",
      greenFlagsLabel: "Green flags",
      noneSpotted: "None spotted.",
      severity: { low: "Low", medium: "Medium", high: "High" },
      sourceFR: "FR",
      sourceFRTooltip: "Detected by the French recruiter-speak dictionary.",
      adviceLabel: "Ask the recruiter:",
    },
    company: {
      title: "About the company",
      sizeLabel: "Size",
      industryLabel: "Industry",
      stageLabel: "Stage",
      fundingLabel: "Funding",
      techStack: "Tech stack",
      perks: "Perks mentioned",
      cultureSignals: "Culture signals",
      sizeHints: {
        startup: "< 50 people",
        scaleup: "50–500 people",
        midsize: "500–5k people",
        enterprise: "5k+ people",
        unknown: "not stated",
      },
      sizeLabels: {
        startup: "Startup",
        scaleup: "Scale-up",
        midsize: "Mid-size",
        enterprise: "Enterprise",
        unknown: "Size unknown",
      },
    },
    ghost: {
      badgeLabel: "Ghost job suspect",
      breakdownTitle: "Why we flagged this",
      criteria: {
        vagueDescription: "Description vagueness",
        noSalary: "Salary disclosure",
        externalRecruiter: "Posted by recruiter",
        genericCompany: "Corporate fluff",
      },
      whatItMeans:
        "Some postings are pipeline padding rather than actual openings. Ask the recruiter why the role is open and the team's last 2 hires before investing time.",
    },
    fit: {
      title: "Personal fit",
      eyebrow: "Personalised against your profile",
      labels: { strong: "Strong fit", ok: "Decent fit", weak: "Weak fit" },
      empty: {
        title: "Set up your profile to see your personal fit score.",
        body: "Your fit score is computed locally against the analysis on this page — no data leaves your browser.",
        cta: "Open profile",
      },
      sections: {
        strengths: "Strengths",
        frictions: "Frictions",
      },
      tonalLabels: {
        strong: "Why this fits",
        ok: "Mixed signals",
        weak: "Why this may not fit",
      },
      noNotes: "No notable strengths or frictions to surface.",
    },
    salary: {
      title: "Salary",
      announcedLabel: "Announced",
      marketLabel: "Market median",
      notDisclosed: "Not disclosed",
      notDisclosedHint:
        "Healthy companies state numbers. Ask the recruiter for the band before any interview round.",
      benchmarkUnavailable: "No benchmark for this role/level/location.",
      benchmarkSourceFR: "France · 2025",
      position: {
        below: (delta: number) => `${Math.abs(delta)}% below market`,
        parity: "Within market range",
        above: (delta: number) => `${Math.abs(delta)}% above market`,
      },
      perPeriod: {
        year: "/ year",
        month: "/ month",
        day: "/ day",
      },
    },
    skills: {
      title: "Skills",
      required: "Required",
      niceToHave: "Nice to have",
      implied: "Implied (not stated)",
      empty: "—",
    },
    meta: {
      company: "Company",
      location: "Location",
      remote: "Remote",
      contract: "Contract",
      salary: "Salary",
      remoteLabels: {
        full: "Remote",
        hybrid: "Hybrid",
        onsite: "Onsite",
        unknown: "Remote · unknown",
      },
      seniorityLabels: {
        junior: "Junior",
        mid: "Mid",
        senior: "Senior",
        staff: "Staff+",
        unknown: "Unspecified",
      },
    },
    generation: {
      title: "Tailored content",
      hint: "Generated locally against your CV. Nothing is stored after the response — copy or save what you keep.",
      kinds: {
        "cover-letter": "Cover letter",
        "linkedin-message": "LinkedIn message",
        email: "Application email",
        "interview-prep": "Interview prep",
        "ats-keywords": "ATS keywords",
      },
      tones: {
        neutral: "Neutral",
        enthusiastic: "Enthusiastic",
        direct: "Direct",
      },
      cvMissing: {
        title: "Add your CV first",
        body: "These generators need your CV to write something honest. Paste or upload it in the profile drawer.",
        cta: "Open profile",
      },
      generate: "Generate",
      regenerate: "Regenerate",
      generating: "Drafting…",
      copy: "Copy",
      copied: "Copied",
      copyToast: "Copied to clipboard",
      copyError: "Couldn't copy",
      empty: "Pick a format above and click Generate.",
      labelKind: "Format",
      labelTone: "Tone",
    },
    questions: {
      title: "Questions to ask",
      empty: "No questions surfaced.",
      copy: "Copy",
      copied: "Copied",
      copyAria: "Copy questions",
      copyToast: "Questions copied",
      copyError: "Couldn't copy",
      tabs: {
        all: "All",
        rh: "Recruiter",
        technique: "Technical",
        manager: "Hiring manager",
        final: "Closing",
      },
      categorize: {
        cta: "Group by interview stage",
        loading: "Categorising questions…",
        failed: "Categorisation failed. Showing all questions.",
      },
    },
    source: {
      title: "Original posting",
      subtitle: "Hover a skill or flag to locate it here.",
    },
    mobileTabs: {
      analysis: "Analysis",
      source: "Source",
    },
  },
  profile: {
    triggerLabel: "Profile",
    triggerAria: "Open your profile",
    title: "Your profile",
    subtitle:
      "Stored locally in your browser. Used to personalise the fit score.",
    close: "Close",
    sections: {
      stack: {
        title: "Tech stack",
        hint: "Pick what you actually want to use day-to-day.",
        searchPlaceholder: "Search a tech (e.g. React, k8s, dbt…)",
        addCustom: "Add custom",
        customPlaceholder: "Custom tech name…",
        empty: "No tech selected yet.",
      },
      experience: {
        title: "Experience",
        yearsLabel: "Years of experience",
      },
      compensation: {
        title: "Compensation",
        minLabel: "Minimum acceptable",
        amountPlaceholder: "55000",
        currency: "Currency",
        period: "Period",
        periods: { year: "per year", month: "per month", day: "per day" },
      },
      modalities: {
        title: "Work modalities",
        remoteLabel: "Remote preference",
        remoteOptions: {
          full: "Full remote",
          hybrid: "Hybrid",
          onsite: "Onsite",
          any: "No preference",
        },
        locationLabel: "Where you live",
        locationPlaceholder: "Paris, Lyon, Berlin…",
        zonesLabel: "Acceptable timezones / regions",
        zonesPlaceholder: "EU, EMEA, Remote-EU…",
        zonesHint: "Press Enter to add.",
      },
      languages: {
        title: "Languages",
        placeholder: "fr, en, de…",
        hint: "Press Enter to add.",
      },
      dealBreakers: {
        title: "Deal-breakers",
        placeholder: "No on-call rotation, no legacy stack…",
        hint: "Press Enter to add. Used to flag offers that violate them.",
      },
      weights: {
        title: "What matters to you",
        hint: "Bigger = more weight in your personalised fit score.",
        labels: {
          salary: "Compensation",
          remote: "Remote / flexibility",
          stack: "Stack alignment",
          growth: "Career growth",
          balance: "Work-life balance",
          culture: "Team & culture",
        },
      },
      cv: {
        title: "Your CV",
        hint: "Used to generate cover letters and tailored messages. PDF upload extracts the text locally — the file itself never leaves your browser.",
        empty: "No CV uploaded yet.",
        uploadPdf: "Upload PDF",
        replacePdf: "Replace PDF",
        clearCv: "Clear CV",
        editLabel: "CV text",
        editHint: "Edit freely — the generators use this verbatim.",
        editPlaceholder:
          "Paste your CV here, or upload a PDF and tweak the extracted text.",
        loadedFrom: (filename: string) => `Loaded from ${filename}`,
        extractFailed: "Couldn't extract text from this PDF.",
        extractedToast: "CV extracted — review the text below.",
      },
    },
    actions: {
      saved: "Saved",
      reset: "Reset",
      resetConfirm: "Reset everything?",
      resetConfirmDesc:
        "This clears your profile from this browser. The action cannot be undone.",
      cancel: "Cancel",
      confirmReset: "Yes, reset",
      export: "Export JSON",
      exportFilename: "joa-profile.json",
      exportToast: "Profile exported.",
    },
  },
  application: {
    statusLabel: "Status",
    statusChange: "Change status",
    statuses: {
      interested: "Interested",
      applied: "Applied",
      interview: "Interview",
      offer: "Offer",
      rejected: "Rejected",
      ignored: "Ignored",
    },
    notes: {
      title: "Notes",
      placeholder: "Anything to remember about this offer (markdown OK)…",
    },
    tags: {
      title: "Tags",
      placeholder: "remote-first, dream, onsite-only…",
    },
    contacts: {
      title: "Contacts",
      empty: "No contacts yet.",
      addLabel: "Add contact",
      placeholder: { name: "Name", role: "Role", email: "Email", linkedin: "LinkedIn URL" },
    },
    nextAction: {
      title: "Next action",
      placeholder: "Send follow-up email…",
      dueAtLabel: "Due",
      none: "No next action.",
      add: "Set next action",
      clear: "Clear",
    },
    appliedAtLabel: "Applied on",
    relativeDays: (n: number) => `${n} day${n === 1 ? "" : "s"} ago`,
    section: {
      title: "Application tracking",
      hint: "Notes, tags, status — never leaves your browser.",
    },
  },
  pipeline: {
    triggerLabel: "Pipeline",
    pageTitle: "Application pipeline",
    pageSubtitle:
      "Drag cards between columns to update their status. All local.",
    empty: {
      title: "No analyses yet",
      body: "Analyse a posting to populate your pipeline.",
    },
    filters: {
      tagPlaceholder: "Filter by tag",
      minScoreLabel: "Min score",
      clear: "Clear filters",
    },
    columns: {
      interested: "Interested",
      applied: "Applied",
      interview: "Interview",
      offer: "Offer",
      rejected: "Rejected",
      ignored: "Ignored",
    },
    cardOpen: "Open analysis",
    selectionHint: (n: number) =>
      `${n} selected · ${n >= 2 && n <= 3 ? "ready to compare" : "select 2 or 3 to compare"}`,
    compare: "Compare",
  },
  reminders: {
    title: "Needs your attention",
    followupSuggestion: (company: string, days: number) =>
      `${days} days since you applied to ${company} — send a follow-up?`,
    upcomingAction: (company: string, action: string) =>
      `${company}: ${action}`,
    none: "Nothing pending.",
  },
  compare: {
    pageTitle: "Compare offers",
    pageSubtitle: "Side-by-side, with the diffs highlighted.",
    backToPipeline: "Back to pipeline",
    invalid: "Pick 2 or 3 entries from your pipeline to compare.",
    rows: {
      title: "Title",
      company: "Company",
      verdict: "Verdict",
      fit: "Personal fit",
      salary: "Salary",
      remote: "Remote",
      location: "Location",
      seniority: "Seniority",
      stack: "Required stack",
      redFlags: "Red flags",
      greenFlags: "Green flags",
      status: "Status",
    },
  },
  history: {
    title: "History",
    subtitle: "Last 10 analyses, kept locally in your browser.",
    searchPlaceholder: "Search by title, company, location…",
    clearSearch: "Clear search",
    close: "Close",
    deleteAria: "Delete analysis",
    empty: {
      title: "No analyses yet",
      subtitle: "Your analyses will appear here.",
    },
    noMatches: {
      title: "No matches",
      subtitle: "Try a different search term.",
    },
    groups: {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This week",
      older: "Older",
    },
    relative: {
      justNow: "just now",
      minutes: (n: number) => `${n}m ago`,
      hours: (n: number) => `${n}h ago`,
      days: (n: number) => `${n}d ago`,
    },
    unknownCompany: "Unknown",
  },
  errors: {
    analysisFailed: "Analysis failed.",
  },
} as const;

export type Strings = typeof strings;
