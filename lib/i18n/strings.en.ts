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
    questions: {
      title: "Questions to ask",
      empty: "No questions surfaced.",
      copy: "Copy",
      copied: "Copied",
      copyAria: "Copy questions",
      copyToast: "Questions copied",
      copyError: "Couldn't copy",
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
