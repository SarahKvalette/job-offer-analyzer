import "server-only";
import type { SourceAdapter, SourceId } from "./types";
import { remotiveAdapter } from "./remotive";
import { franceTravailAdapter } from "./francetravail";

export const SOURCE_ADAPTERS: Record<SourceId, SourceAdapter> = {
  remotive: remotiveAdapter,
  francetravail: franceTravailAdapter,
};

export type { SourceAdapter, SourceId } from "./types";
