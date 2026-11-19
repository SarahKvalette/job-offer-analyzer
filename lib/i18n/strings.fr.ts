import type { Strings } from "./strings.en";

/**
 * French dictionary — the default locale (the product is French-first).
 * Same shape as `strings.en.ts` (enforced by the `Strings` type). French
 * typography: non-breaking spaces before : ; ! ?, « guillemets », vouvoiement.
 */
export const strings: Strings = {
  meta: {
    title: "Job Offer Analyzer",
    description:
      "Décryptez n'importe quelle annonce tech en 10 secondes — vraie séniorité, signaux d'alerte cachés, bonnes questions à poser.",
  },
  header: {
    appName: "Job Offer Analyzer",
    version: "v0.1",
    history: "Historique",
    openHistory: "Ouvrir l'historique",
  },
  landing: {
    eyebrow: "Analyse d'annonces par IA",
    title: "Décryptez n'importe quelle annonce d'emploi.",
    subtitle:
      "Un verdict, la vraie séniorité, les signaux d'alerte cachés et les bonnes questions à poser au recruteur — en 10 secondes.",
    privacyHint:
      "Suivi gardé sur votre appareil · Annonce analysée puis non conservée · ⌘ + Entrée pour lancer",
    demo: {
      heading: "Pas d'annonce sous la main ?",
      subheading:
        "Essayez avec une annonce d'exemple — gratuit, instantané, sans rien coller.",
      ownLabel: "Ou analysez votre propre annonce ci-dessous",
      tryAria: (label: string) => `Essayer l'exemple : ${label}`,
      badge: "Exemple",
      bannerTitle: "Ceci est une annonce d'exemple",
      bannerBody:
        "Analyse pré-calculée, à titre de démonstration. Collez votre propre annonce pour une analyse personnalisée.",
      bannerCta: "Analyser ma propre annonce",
      questionsTitle: "Questions à poser au recruteur",
    },
  },
  features: {
    verdict: {
      title: "Verdict 0–10",
      body: "Une note, une phrase. Postuler, prudence, ou éviter.",
    },
    redFlags: {
      title: "Signaux d'alerte décodés",
      body: "« Startup dynamique » → attendez-vous aux heures sup. « Comme une famille » → frontières floues.",
    },
    seniority: {
      title: "Vraie séniorité",
      body: "Un intitulé « senior » qui demande 2 ans ? On le repère.",
    },
    questions: {
      title: "Questions pertinentes",
      body: "3 à 5 questions précises à poser au recruteur — jamais génériques.",
    },
    sectionAriaLabel: "Ce que vous obtenez",
  },
  form: {
    placeholder: "Collez une annonce, ou déposez un PDF ici.",
    sample: "Exemple",
    pdfButton: "PDF",
    removePdf: "Retirer le PDF",
    dropPdf: "Déposez le PDF pour l'extraire",
    analyze: "Analyser",
    analyzing: "Analyse en cours",
    newAnalysis: "Nouvelle analyse",
    minChars: (current: number, min: number) => `${current} / ${min}`,
    maxChars: (current: number, max: number) =>
      `${current.toLocaleString("fr-FR")} / ${max.toLocaleString(
        "fr-FR"
      )} — trop long`,
    chars: (current: number) => `${current.toLocaleString("fr-FR")}`,
    pdf: {
      extractedToast: "Texte du PDF extrait — relisez puis analysez.",
      onlyPdfError: "Déposez un fichier PDF (ou collez le texte directement).",
      extractFailed: "Échec de l'extraction du PDF.",
    },
    url: {
      detected: "On dirait une URL d'annonce.",
      fetch: "Récupérer la page",
      fetching: "Récupération…",
      fetched: "Page extraite — relisez puis analysez.",
      failed: "Impossible de récupérer cette URL.",
      hostUnsupported:
        "Seuls LinkedIn, Welcome to the Jungle, Indeed et JobTeaser sont pris en charge. Sinon, collez le texte directement.",
    },
  },
  loading: {
    messages: [
      "Lecture de l'annonce…",
      "Repérage des signaux d'alerte…",
      "Vérification de la vraie séniorité…",
      "Liste des compétences non dites…",
      "Rédaction des bonnes questions…",
      "Presque fini — on finalise le verdict…",
    ],
  },
  result: {
    sections: {
      realityCheck: "Décryptage",
      context: "Contexte",
      nextSteps: "Étapes suivantes",
      questionsTitle: "Questions à poser au recruteur",
      questionsHint:
        "Des questions pertinentes, éventuellement groupées par étape d'entretien.",
      generationTitle: "Contenu sur mesure",
      generationHint:
        "Lettre de motivation, message LinkedIn, e-mail de candidature, préparation d'entretien, mots-clés ATS.",
      trackingTitle: "Suivi de candidature",
      trackingHint: "Statut, notes, tags, contacts, prochaine action.",
    },
    verdict: {
      eyebrow: "verdict global",
      copy: "Copier",
      copied: "Copié",
      copyAria: "Copier en Markdown",
      copyToast: "Analyse copiée en Markdown",
      copyError: "Impossible de copier dans le presse-papiers",
      export: "Exporter",
      exportAria: "Télécharger en Markdown",
    },
    sentiment: {
      apply: "Postuler",
      caution: "Prudence",
      avoid: "Éviter",
    },
    realityCheck: {
      title: "Décryptage",
      realSeniorityLabel: "Vraie séniorité",
      redFlagsLabel: "Signaux d'alerte",
      greenFlagsLabel: "Bons signaux",
      noneSpotted: "Rien à signaler.",
      severity: { low: "Faible", medium: "Moyen", high: "Élevé" },
      sourceFR: "FR",
      sourceFRTooltip: "Détecté par le dictionnaire du jargon recruteur français.",
      adviceLabel: "À demander au recruteur :",
    },
    company: {
      title: "À propos de l'entreprise",
      sizeLabel: "Taille",
      industryLabel: "Secteur",
      stageLabel: "Stade",
      fundingLabel: "Levée de fonds",
      techStack: "Stack technique",
      perks: "Avantages mentionnés",
      cultureSignals: "Signaux de culture",
      sizeHints: {
        startup: "< 50 personnes",
        scaleup: "50–500 personnes",
        midsize: "500–5 000 personnes",
        enterprise: "5 000+ personnes",
        unknown: "non précisé",
      },
      sizeLabels: {
        startup: "Startup",
        scaleup: "Scale-up",
        midsize: "Taille moyenne",
        enterprise: "Grand groupe",
        unknown: "Taille inconnue",
      },
    },
    ghost: {
      badgeLabel: "Offre fantôme probable",
      breakdownTitle: "Pourquoi on l'a signalée",
      criteria: {
        vagueDescription: "Description vague",
        noSalary: "Salaire affiché",
        externalRecruiter: "Publiée par un cabinet",
        genericCompany: "Discours corporate creux",
      },
      whatItMeans:
        "Certaines annonces alimentent un vivier plutôt qu'un vrai poste. Demandez au recruteur pourquoi le poste est ouvert et quelles ont été les 2 dernières embauches de l'équipe avant d'investir du temps.",
    },
    fit: {
      title: "Adéquation personnelle",
      eyebrow: "Personnalisé selon votre profil",
      labels: {
        strong: "Bonne adéquation",
        ok: "Adéquation correcte",
        weak: "Faible adéquation",
      },
      empty: {
        title: "Renseignez votre profil pour voir votre score d'adéquation.",
        body: "Votre score est calculé localement, par rapport à l'analyse de cette page — aucune donnée ne quitte votre navigateur.",
        cta: "Ouvrir le profil",
      },
      sections: {
        strengths: "Points forts",
        frictions: "Frictions",
      },
      tonalLabels: {
        strong: "Pourquoi ça colle",
        ok: "Signaux mitigés",
        weak: "Pourquoi ça peut ne pas coller",
      },
      noNotes: "Aucun point fort ni friction notable à signaler.",
    },
    salary: {
      title: "Salaire",
      announcedLabel: "Annoncé",
      marketLabel: "Médiane du marché",
      notDisclosed: "Non communiqué",
      notDisclosedHint:
        "Une entreprise saine affiche des chiffres. Demandez la fourchette au recruteur avant tout entretien.",
      benchmarkUnavailable: "Pas de référence pour ce poste / niveau / lieu.",
      benchmarkSourceFR: "France · 2025",
      position: {
        below: (delta: number) => `${Math.abs(delta)} % sous le marché`,
        parity: "Dans la fourchette du marché",
        above: (delta: number) => `${Math.abs(delta)} % au-dessus du marché`,
      },
      perPeriod: {
        year: "/ an",
        month: "/ mois",
        day: "/ jour",
      },
    },
    skills: {
      title: "Compétences",
      required: "Requises",
      niceToHave: "Un plus",
      implied: "Implicites (non dites)",
      empty: "—",
    },
    meta: {
      company: "Entreprise",
      location: "Lieu",
      remote: "Télétravail",
      contract: "Contrat",
      salary: "Salaire",
      remoteLabels: {
        full: "Télétravail total",
        hybrid: "Hybride",
        onsite: "Sur site",
        unknown: "Télétravail · non précisé",
      },
      seniorityLabels: {
        junior: "Junior",
        mid: "Confirmé",
        senior: "Senior",
        staff: "Lead",
        unknown: "Non précisé",
      },
    },
    generation: {
      title: "Contenu sur mesure",
      hint: "Généré localement à partir de votre CV. Rien n'est conservé après la réponse — copiez ou enregistrez ce que vous gardez.",
      kinds: {
        "cover-letter": "Lettre de motivation",
        "linkedin-message": "Message LinkedIn",
        email: "E-mail de candidature",
        "interview-prep": "Préparation d'entretien",
        "ats-keywords": "Mots-clés ATS",
      },
      tones: {
        neutral: "Neutre",
        enthusiastic: "Enthousiaste",
        direct: "Direct",
      },
      cvMissing: {
        title: "Ajoutez d'abord votre CV",
        body: "Ces générateurs ont besoin de votre CV pour écrire quelque chose d'honnête. Collez-le ou importez-le dans le panneau profil.",
        cta: "Ouvrir le profil",
      },
      generate: "Générer",
      regenerate: "Régénérer",
      generating: "Rédaction…",
      copy: "Copier",
      copied: "Copié",
      copyToast: "Copié dans le presse-papiers",
      copyError: "Impossible de copier",
      empty: "Choisissez un format ci-dessus puis cliquez sur Générer.",
      labelKind: "Format",
      labelTone: "Ton",
    },
    questions: {
      title: "Questions à poser",
      empty: "Aucune question proposée.",
      copy: "Copier",
      copied: "Copié",
      copyAria: "Copier les questions",
      copyToast: "Questions copiées",
      copyError: "Impossible de copier",
      tabs: {
        all: "Toutes",
        rh: "RH",
        technique: "Technique",
        manager: "Manager",
        final: "Clôture",
      },
      categorize: {
        cta: "Grouper par étape d'entretien",
        loading: "Classement des questions…",
        failed: "Échec du classement. Toutes les questions sont affichées.",
      },
    },
    source: {
      title: "Annonce d'origine",
      subtitle: "Survolez une compétence ou un signal pour le localiser ici.",
    },
    mobileTabs: {
      analysis: "Analyse",
      source: "Annonce",
    },
    contest: {
      honesty:
        "Cette analyse est une aide à la décision, pas un verdict. À vous de trancher.",
      notSourced: "non sourcé",
      notSourcedTooltip:
        "Cette citation est introuvable telle quelle dans l'annonce.",
      disagree: "Pas d'accord",
      restore: "Rétablir",
      contested: "Contesté",
      notePlaceholder: "Pourquoi n'êtes-vous pas d'accord ? (facultatif)",
      expandAria: "Afficher la citation et contester ce signal",
      sourceHint: "Surligné dans l'annonce.",
    },
    score: {
      yourScore: "Votre note",
      aiScore: "Note IA",
      set: "Ajuster ma note",
      clear: "Réinitialiser",
      yourLabel: "la vôtre",
    },
  },
  profile: {
    triggerLabel: "Profil",
    triggerAria: "Ouvrir votre profil",
    title: "Votre profil",
    subtitle:
      "Gardé localement dans votre navigateur. Sert à personnaliser le score d'adéquation.",
    close: "Fermer",
    sections: {
      stack: {
        title: "Stack technique",
        hint: "Choisissez ce que vous voulez vraiment utiliser au quotidien.",
        searchPlaceholder: "Chercher une techno (ex. React, k8s, dbt…)",
        addCustom: "Ajouter",
        customPlaceholder: "Nom de la techno…",
        empty: "Aucune techno sélectionnée.",
      },
      experience: {
        title: "Expérience",
        yearsLabel: "Années d'expérience",
      },
      compensation: {
        title: "Rémunération",
        minLabel: "Minimum acceptable",
        amountPlaceholder: "55000",
        currency: "Devise",
        period: "Période",
        periods: { year: "par an", month: "par mois", day: "par jour" },
      },
      modalities: {
        title: "Modalités de travail",
        remoteLabel: "Préférence de télétravail",
        remoteOptions: {
          full: "Télétravail total",
          hybrid: "Hybride",
          onsite: "Sur site",
          any: "Peu importe",
        },
        locationLabel: "Où vous vivez",
        locationPlaceholder: "Paris, Lyon, Berlin…",
        zonesLabel: "Fuseaux / régions acceptés",
        zonesPlaceholder: "UE, EMEA, Remote-EU…",
        zonesHint: "Appuyez sur Entrée pour ajouter.",
      },
      languages: {
        title: "Langues",
        placeholder: "fr, en, de…",
        hint: "Appuyez sur Entrée pour ajouter.",
      },
      dealBreakers: {
        title: "Critères rédhibitoires",
        placeholder: "Pas d'astreinte, pas de stack legacy…",
        hint: "Appuyez sur Entrée pour ajouter. Sert à signaler les offres qui les enfreignent.",
      },
      weights: {
        title: "Ce qui compte pour vous",
        hint: "Plus grand = plus de poids dans votre score d'adéquation personnalisé.",
        labels: {
          salary: "Rémunération",
          remote: "Télétravail / flexibilité",
          stack: "Alignement de la stack",
          growth: "Évolution de carrière",
          balance: "Équilibre vie pro / perso",
          culture: "Équipe & culture",
        },
      },
      google: {
        title: "Compte Google",
        hint: "Facultatif — réservé au propriétaire. Sert à repérer les e-mails de recruteurs (Gmail, lecture seule) et à créer des événements d'entretien (Calendar). Rien n'est envoyé sans que vous cliquiez sur un bouton.",
        connect: "Connecter Google",
        disconnect: "Déconnecter",
        connecting: "Redirection…",
        disconnecting: "Déconnexion…",
        connectedAs: (email: string) => `Connecté en tant que ${email}`,
        notOwnerHint: "Connectez-vous en tant que propriétaire pour lier Google.",
        signIn: "Se connecter",
        notConfiguredHint:
          "Serveur pas encore configuré — définissez d'abord GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET et provisionnez Vercel KV.",
        toastConnected: (email: string) => `Google connecté : ${email}`,
        toastConnectedGeneric: "Google connecté",
        toastDisconnected: "Google déconnecté.",
        toastError: (reason: string) =>
          `Impossible de connecter Google (${reason}).`,
      },
      cv: {
        title: "Votre CV",
        hint: "Sert à générer lettres de motivation et messages sur mesure. L'import PDF extrait le texte localement — le fichier lui-même ne quitte jamais votre navigateur.",
        empty: "Aucun CV importé.",
        uploadPdf: "Importer un PDF",
        replacePdf: "Remplacer le PDF",
        clearCv: "Effacer le CV",
        editLabel: "Texte du CV",
        editHint: "Modifiez librement — les générateurs l'utilisent tel quel.",
        editPlaceholder:
          "Collez votre CV ici, ou importez un PDF et ajustez le texte extrait.",
        loadedFrom: (filename: string) => `Chargé depuis ${filename}`,
        extractFailed: "Impossible d'extraire le texte de ce PDF.",
        extractedToast: "CV extrait — relisez le texte ci-dessous.",
      },
      data: {
        title: "Vos données",
        advantage:
          "Tout reste sur votre appareil — pas de compte, rien à créer, rien n'est envoyé pour être conservé.",
        limit:
          "Pas de synchronisation entre appareils, et vider votre navigateur efface tout. Exportez régulièrement.",
        serverNote:
          "Précision honnête : le texte d'une annonce transite bien par le serveur le temps de l'analyse (quelques secondes), mais il n'y est jamais conservé.",
        export: "Exporter mes analyses",
        exportEmpty: "Aucune analyse à exporter.",
        exportFilename: "joa-analyses.json",
        exportToast: (n: number) =>
          `${n} analyse${n === 1 ? "" : "s"} exportée${n === 1 ? "" : "s"}.`,
        import: "Importer…",
        chooseMode: (n: number) =>
          `${n} analyse${n === 1 ? "" : "s"} dans le fichier. Fusionner avec les vôtres, ou tout remplacer ?`,
        merge: "Fusionner",
        replace: "Remplacer",
        cancel: "Annuler",
        importedToast: (n: number) =>
          `${n} analyse${n === 1 ? "" : "s"} importée${n === 1 ? "" : "s"}.`,
        reminder: (n: number) =>
          `Vous avez ${n} analyses enregistrées — pensez à exporter une sauvegarde.`,
        errors: {
          unreadable: "Fichier illisible (JSON invalide).",
          wrong_type: "Ce n'est pas un fichier d'export Job Offer Analyzer.",
          empty: "Aucune analyse valide dans ce fichier.",
        },
        measure: {
          title: "Ce que nous mesurons",
          body: "Des totaux anonymes, pour améliorer l'outil : analyse lancée, analyse enregistrée, relance programmée, retour après 7 jours, exemple ouvert.",
          never:
            "Jamais : le texte des annonces, les noms d'entreprise, aucun identifiant, aucun cookie, aucun traçage individuel. Mesure via Vercel Web Analytics (sans cookies).",
        },
      },
    },
    actions: {
      saved: "Enregistré",
      reset: "Réinitialiser",
      resetConfirm: "Tout réinitialiser ?",
      resetConfirmDesc:
        "Cela efface votre profil de ce navigateur. L'action est irréversible.",
      cancel: "Annuler",
      confirmReset: "Oui, réinitialiser",
      export: "Exporter en JSON",
      exportFilename: "joa-profil.json",
      exportToast: "Profil exporté.",
    },
  },
  application: {
    statusLabel: "Statut",
    statusChange: "Changer le statut",
    statuses: {
      interested: "Intéressé·e",
      applied: "Postulé",
      interview: "Entretien",
      offer: "Offre",
      rejected: "Refusé",
      ignored: "Ignoré",
    },
    notes: {
      title: "Notes",
      placeholder: "Ce qu'il faut retenir sur cette offre (markdown accepté)…",
    },
    tags: {
      title: "Tags",
      placeholder: "remote-first, rêve, sur-site uniquement…",
    },
    contacts: {
      title: "Contacts",
      empty: "Aucun contact.",
      addLabel: "Ajouter un contact",
      placeholder: {
        name: "Nom",
        role: "Rôle",
        email: "E-mail",
        linkedin: "URL LinkedIn",
      },
    },
    nextAction: {
      title: "Prochaine action",
      placeholder: "Envoyer un e-mail de relance…",
      dueAtLabel: "Échéance",
      none: "Aucune action prévue.",
      add: "Définir la prochaine action",
      clear: "Effacer",
    },
    followUp: {
      title: "Date de relance",
      hint: "Apparaît dans « À relancer aujourd'hui » sur l'écran d'accueil.",
      clear: "Effacer",
    },
    appliedAtLabel: "Postulé le",
    relativeDays: (n: number) => `il y a ${n} jour${n === 1 ? "" : "s"}`,
    section: {
      title: "Suivi de candidature",
      hint: "Notes, tags, statut — ne quitte jamais votre navigateur.",
    },
  },
  stats: {
    pageTitle: "Vos statistiques",
    pageSubtitle: "Local uniquement — calculé depuis l'historique de votre navigateur.",
    empty: {
      title: "Rien à afficher pour l'instant",
      body: "Analysez quelques annonces, le tableau de bord se remplit tout seul.",
    },
    totalAnalyses: "Annonces analysées",
    averageScore: "Verdict moyen",
    applyToInterview: "Postulé → Entretien",
    interviewToOffer: "Entretien → Offre",
    pipelineDistribution: "Répartition du pipeline",
    timeline: "8 dernières semaines",
    topRedFlags: "Signaux d'alerte les plus fréquents",
  },
  discover: {
    triggerLabel: "Découvrir",
    pageTitle: "Correspondances du jour",
    pageSubtitle:
      "Offres fraîches récupérées chaque jour sur France Travail et Remotive, filtrées selon vos recherches enregistrées.",
    emptyTitle: "Rien aujourd'hui",
    emptyBody:
      "Soit aucune offre depuis la dernière récupération, soit vos recherches enregistrées ont besoin de mots-clés plus larges.",
    noSearches: {
      title: "Aucune recherche enregistrée",
      body: "Définissez une recherche dans le panneau profil — JOA récupérera chaque jour ce qui correspond.",
      cta: "Ouvrir le profil",
    },
    sectionTitle: "Recherches enregistrées",
    sectionHint:
      "Réservé au propriétaire. JOA récupère chaque jour et vous envoie les nouvelles correspondances dans le digest hebdomadaire.",
    addSearch: "Ajouter une recherche",
    newSearchLabel: "Nouvelle recherche enregistrée",
    empty: "Aucune recherche enregistrée.",
    kvMissing: "Vercel KV n'est pas encore configuré — provisionnez-le d'abord.",
    ftUnconfigured:
      "Identifiants France Travail manquants (FT_CLIENT_ID / FT_CLIENT_SECRET). Remotive fonctionnera quand même.",
    labelAria: "Libellé de la recherche",
    deleteAria: "Supprimer la recherche",
    keywordsLabel: "Mots-clés (au moins un)",
    keywordsPlaceholder: "react, senior, typescript…",
    excludeLabel: "Exclure (aucun de ceux-ci)",
    excludePlaceholder: "lead, manager…",
    remoteLabel: "Télétravail",
    minSalaryLabel: "Salaire min. (€/an)",
    locationsLabel: "Lieux",
    locationsPlaceholder: "Paris, Lyon…",
    locationsHint: "Ignoré pour les postes en télétravail.",
    sourcesLabel: "Sources",
    viewMatches: "Voir les correspondances dans /discover",
    remote: {
      any: "Peu importe",
      only: "Télétravail uniquement",
      no: "Sur site uniquement",
    },
    offerCard: {
      newToday: "Nouveau",
      remote: "Télétravail",
      viaSource: "via",
      openOriginal: "Ouvrir l'offre",
      analyse: "Analyser",
    },
    lastRun: (when: string) => `Dernière récupération · ${when}`,
    newSinceDigest: (n: number) =>
      `${n} nouvelle${n === 1 ? "" : "s"} offre${
        n === 1 ? "" : "s"
      } depuis votre dernier digest`,
  },
  digest: {
    sectionTitle: "E-mail digest hebdomadaire",
    sectionHint:
      "Réservé au propriétaire. Un petit rappel du lundi matin avec un lien vers /stats. Aucune donnée d'analyse n'est envoyée.",
    enabledLabel: "M'envoyer un point hebdomadaire",
    emailLabel: "E-mail destinataire",
    emailPlaceholder: "vous@exemple.com",
    notConfigured:
      "Serveur pas encore configuré — définissez RESEND_API_KEY et provisionnez Vercel KV d'abord.",
    saved: "Préférences du digest enregistrées.",
    sendNow: "Envoyer un test maintenant",
    sending: "Envoi…",
    sent: "Test envoyé.",
    failed: "Impossible d'envoyer l'e-mail de test.",
  },
  gmail: {
    scanCta: "Scanner Gmail pour les recruteurs",
    scanning: "Analyse de votre boîte de réception…",
    daysLabel: "14 derniers jours",
    notConnected: "Connectez d'abord Google dans votre profil.",
    failed: "Échec du scan Gmail.",
    empty: "Aucun e-mail ressemblant à un recruteur sur la période.",
    foundCount: (n: number) =>
      `${n} e-mail${n === 1 ? "" : "s"} de recruteur potentiel${
        n === 1 ? "" : "s"
      } trouvé${n === 1 ? "" : "s"}`,
    domainBadge: "Recruteur connu",
    keywordBadge: (n: number) => `${n} mot${n === 1 ? "" : "s"}-clé${n === 1 ? "" : "s"}`,
    openInGmail: "Ouvrir dans Gmail",
    analyse: "Analyser l'annonce",
    dismiss: "Ignorer",
  },
  calendar: {
    addEvent: "Ajouter à Google Calendar",
    creating: "Création de l'événement…",
    created: "Événement créé",
    failed: "Impossible de créer l'événement.",
    notConnected: "Connectez d'abord Google dans votre profil.",
    noDate: "Définissez d'abord une date sur la prochaine action.",
    openInCalendar: "Ouvrir dans Google Calendar",
  },
  pipeline: {
    triggerLabel: "Pipeline",
    pageTitle: "Pipeline de candidatures",
    pageSubtitle:
      "Glissez les cartes entre les colonnes pour changer leur statut. Tout est local.",
    empty: {
      title: "Aucune analyse",
      body: "Analysez une annonce pour remplir votre pipeline.",
    },
    filters: {
      tagPlaceholder: "Filtrer par tag",
      minScoreLabel: "Note min.",
      clear: "Effacer les filtres",
    },
    columns: {
      interested: "Intéressé·e",
      applied: "Postulé",
      interview: "Entretien",
      offer: "Offre",
      rejected: "Refusé",
      ignored: "Ignoré",
    },
    cardOpen: "Ouvrir l'analyse",
    selectionHint: (n: number) =>
      `${n} sélectionnée${n === 1 ? "" : "s"} · ${
        n >= 2 && n <= 3 ? "prêt à comparer" : "sélectionnez-en 2 ou 3 à comparer"
      }`,
    compare: "Comparer",
  },
  reminders: {
    title: "À traiter",
    followupSuggestion: (company: string, days: number) =>
      `${days} jours depuis votre candidature chez ${company} — envoyer une relance ?`,
    upcomingAction: (company: string, action: string) =>
      `${company} : ${action}`,
    none: "Rien en attente.",
  },
  compare: {
    pageTitle: "Comparer les offres",
    pageSubtitle: "Côte à côte, avec les différences surlignées.",
    backToPipeline: "Retour au pipeline",
    invalid: "Choisissez 2 ou 3 entrées de votre pipeline à comparer.",
    rows: {
      title: "Intitulé",
      company: "Entreprise",
      verdict: "Verdict",
      fit: "Adéquation",
      salary: "Salaire",
      remote: "Télétravail",
      location: "Lieu",
      seniority: "Séniorité",
      stack: "Stack requise",
      redFlags: "Signaux d'alerte",
      greenFlags: "Bons signaux",
      status: "Statut",
    },
  },
  palette: {
    triggerLabel: "Rechercher",
    placeholder: "Tapez une commande ou cherchez dans l'historique…",
    empty: "Aucun résultat.",
    groups: {
      navigate: "Naviguer",
      actions: "Actions",
      history: "Historique",
    },
    actions: {
      newAnalysis: "Nouvelle analyse",
      openProfile: "Ouvrir votre profil",
      openHistory: "Ouvrir l'historique",
      openPipeline: "Ouvrir le pipeline",
      openStats: "Ouvrir les statistiques",
      openDiscover: "Ouvrir le flux Découvrir",
      toggleTheme: "Basculer thème clair / sombre",
    },
    shortcut: "⌘ K",
  },
  history: {
    title: "Historique",
    subtitle: "Vos analyses, gardées localement dans votre navigateur.",
    searchPlaceholder: "Chercher par intitulé, entreprise, lieu…",
    clearSearch: "Effacer la recherche",
    close: "Fermer",
    deleteAria: "Supprimer l'analyse",
    empty: {
      title: "Aucune analyse",
      subtitle: "Vos analyses apparaîtront ici.",
    },
    noMatches: {
      title: "Aucun résultat",
      subtitle: "Essayez un autre terme de recherche.",
    },
    groups: {
      today: "Aujourd'hui",
      yesterday: "Hier",
      thisWeek: "Cette semaine",
      older: "Plus ancien",
    },
    relative: {
      justNow: "à l'instant",
      minutes: (n: number) => `il y a ${n} min`,
      hours: (n: number) => `il y a ${n} h`,
      days: (n: number) => `il y a ${n} j`,
    },
    unknownCompany: "Inconnue",
  },
  save: {
    title: "Enregistrer cette analyse ?",
    companyLabel: "Entreprise",
    companyPlaceholder: "Nom de l'entreprise",
    titleLabel: "Intitulé du poste",
    titlePlaceholder: "Intitulé du poste",
    cta: "Enregistrer",
    discard: "Abandonner",
    hint: "Rien n'est enregistré tant que vous ne cliquez pas sur Enregistrer — votre analyse reste sur votre appareil.",
  },
  followups: {
    title: "À relancer aujourd'hui",
    overdue: (n: number) => `${n} j de retard`,
    today: "Aujourd'hui",
  },
  errors: {
    analysisFailed: "Échec de l'analyse.",
  },
  auth: {
    pageTitle: "Connexion propriétaire",
    pageSubtitle:
      "Seul le propriétaire peut utiliser les fonctions cloud (Gmail / Calendar / digest). Les fonctions publiques restent ouvertes.",
    passwordLabel: "Mot de passe propriétaire",
    submit: "Se connecter",
    submitting: "Connexion…",
    success: "Connecté.",
    incorrect: "Mot de passe incorrect.",
    failed: "Impossible de se connecter.",
    logout: "Se déconnecter",
  },
};
