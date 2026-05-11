import "server-only";
import type { SavedSearch, StoredOffer } from "@/lib/schemas/discover";
import { makeOfferId } from "@/lib/server/discover";
import { getKv, isKvConfigured, KV_KEYS } from "@/lib/server/kv";
import { stripHtml, truncate, type SourceAdapter } from "./types";

/**
 * France Travail (ex Pôle Emploi) "Offres d'emploi v2" API.
 *
 * Auth: OAuth2 `client_credentials`, scope `api_offresdemploiv2 o2dsoffre`.
 * Token TTL is ~24min; we cache it in KV with a safety margin.
 *
 * Env required:
 *  - FT_CLIENT_ID
 *  - FT_CLIENT_SECRET
 *
 * Docs: https://francetravail.io/data/api/offres-emploi
 */

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const SEARCH_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

type CachedToken = { access_token: string; expiresAt: number };

function readCreds(): { id: string; secret: string } | null {
  const id = process.env.FT_CLIENT_ID;
  const secret = process.env.FT_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { id, secret };
}

async function readCachedToken(): Promise<CachedToken | null> {
  if (!isKvConfigured()) return null;
  const raw = await getKv().get<string | CachedToken>(KV_KEYS.franceTravailToken);
  if (!raw) return null;
  const parsed = typeof raw === "string" ? safeJson<CachedToken>(raw) : raw;
  if (!parsed) return null;
  if (parsed.expiresAt < Date.now() + 30_000) return null;
  return parsed;
}

function safeJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

async function fetchToken(): Promise<string> {
  const creds = readCreds();
  if (!creds) {
    throw new Error("FT_CLIENT_ID / FT_CLIENT_SECRET not set.");
  }
  const cached = await readCachedToken();
  if (cached) return cached.access_token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.id,
    client_secret: creds.secret,
    scope: "api_offresdemploiv2 o2dsoffre",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`France Travail token request failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  const expiresAt = Date.now() + Math.max(60, data.expires_in - 30) * 1000;
  const entry: CachedToken = { access_token: data.access_token, expiresAt };
  if (isKvConfigured()) {
    await getKv().set(KV_KEYS.franceTravailToken, JSON.stringify(entry));
  }
  return data.access_token;
}

type RawOffer = {
  id: string;
  intitule?: string;
  description?: string;
  dateCreation?: string;
  dateActualisation?: string;
  entreprise?: { nom?: string };
  lieuTravail?: { libelle?: string };
  typeContrat?: string;
  salaire?: { libelle?: string };
  origineOffre?: { urlOrigine?: string };
  romeLibelle?: string;
};

type SearchResponse = {
  resultats?: RawOffer[];
};

/**
 * Same loose salary parser as the Remotive adapter, but FR-only — text
 * here looks like "Annuel de 45000 Euros à 60000 Euros sur 12 mois".
 */
function parseFrSalary(text: string | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!text) return { min: null, max: null };
  const nums = [...text.matchAll(/(\d{2,3}(?:[.\s]?\d{3})?)/g)]
    .map((m) => Number(m[1].replace(/[.\s]/g, "")))
    .filter((n) => isFinite(n) && n >= 10_000 && n <= 500_000);
  if (nums.length === 0) return { min: null, max: null };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (text.toLowerCase().includes("mensuel")) {
    return { min: min * 12, max: max * 12 };
  }
  return { min, max };
}

function buildParams(search: SavedSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.keywords.length > 0) {
    params.set("motsCles", search.keywords.join(","));
  }
  if (search.locations.length > 0) {
    params.set("commune", search.locations[0]);
  }
  if (search.minSalaryEUR) {
    params.set("salaireMin", String(search.minSalaryEUR));
    params.set("periodeSalaire", "A");
  }
  params.set("range", "0-49");
  params.set("sort", "1"); // Sort by date desc.
  return params;
}

export const franceTravailAdapter: SourceAdapter = {
  id: "francetravail",
  isConfigured: () => readCreds() !== null,
  async fetchForSearch(search) {
    const token = await fetchToken();
    const params = buildParams(search);
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      cache: "no-store",
    });
    if (res.status === 204) return [];
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`France Travail search failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as SearchResponse;
    const items = data.resultats ?? [];
    const now = Date.now();
    return items
      .filter((it) => Boolean(it.origineOffre?.urlOrigine || it.id))
      .map((it): StoredOffer => {
        const url =
          it.origineOffre?.urlOrigine ??
          `https://candidat.francetravail.fr/offres/recherche/detail/${it.id}`;
        const description = stripHtml(it.description ?? "");
        const salary = parseFrSalary(it.salaire?.libelle);
        const publishedAt = (() => {
          const candidate = it.dateCreation ?? it.dateActualisation;
          if (!candidate) return now;
          const t = Date.parse(candidate);
          return isFinite(t) ? t : now;
        })();
        const remote = /tél[eé]travail|remote|100\s?%\s?distanciel/i.test(
          (it.description ?? "") + " " + (it.intitule ?? "")
        );
        return {
          id: makeOfferId(url),
          source: "francetravail",
          title: it.intitule ?? "Untitled",
          company: it.entreprise?.nom ?? "—",
          location: it.lieuTravail?.libelle ?? "France",
          remote,
          salaryText: it.salaire?.libelle?.trim() || null,
          salaryMinEUR: salary.min,
          salaryMaxEUR: salary.max,
          url,
          description: truncate(description),
          tags: it.romeLibelle ? [it.romeLibelle] : [],
          publishedAt,
          fetchedAt: now,
          matchedSearchIds: [],
        };
      });
  },
};
