"use client";

import { useOwner } from "@/lib/hooks/use-owner";

/**
 * Renders its children only for the signed-in owner. Everyone else (the
 * public) sees nothing. Used to keep owner-only cloud features — Discover,
 * Gmail scan — out of the public portfolio view while leaving the local
 * analyser and tracking fully open.
 */
export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { isOwner } = useOwner();
  if (!isOwner) return null;
  return <>{children}</>;
}
