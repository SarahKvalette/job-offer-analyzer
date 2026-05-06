"use client";

import { createContext, useContext, useMemo, useState } from "react";

type HighlightContextValue = {
  active: string | null;
  setActive: (phrase: string | null) => void;
};

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function HighlightProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight(): HighlightContextValue {
  const ctx = useContext(HighlightContext);
  if (!ctx) {
    throw new Error("useHighlight must be used inside <HighlightProvider>");
  }
  return ctx;
}

export function useEvidenceHandlers(phrase: string) {
  const { setActive } = useHighlight();
  return {
    onMouseEnter: () => setActive(phrase),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(phrase),
    onBlur: () => setActive(null),
  };
}
