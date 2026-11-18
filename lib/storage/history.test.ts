import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { StoredAnalysis } from "@/lib/schemas/analysis";
import {
  __resetHistoryForTests,
  deleteAnalysis,
  getById,
  getHistorySnapshot,
  hydrateHistory,
  saveAnalysis,
  updateApplication,
} from "./history";

const VALID_ANALYSIS = {
  meta: {
    title: "Product Designer",
    company: "Acme",
    location: "Paris",
    remote: "hybrid" as const,
    contractType: "CDI",
    salaryRange: { min: 50000, max: 70000, currency: "EUR" },
    seniorityAnnounced: "mid" as const,
  },
  skills: { required: [], niceToHave: [], impliedButUnstated: [] },
  realityCheck: {
    redFlags: [],
    greenFlags: [],
    seniorityRealVsAnnounced: { real: "mid" as const, reasoning: "ok" },
  },
  questionsToAsk: [],
};

function makeEntry(id: string, createdAt: number): StoredAnalysis {
  return { id, createdAt, jobText: `poste ${id}`, analysis: VALID_ANALYSIS };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function installWindowMock() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Set<(e: Event) => void>>();
  const windowMock = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    addEventListener(type: string, cb: (e: Event) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(cb);
    },
    removeEventListener(type: string, cb: (e: Event) => void) {
      listeners.get(type)?.delete(cb);
    },
    dispatchEvent(event: Event) {
      listeners.get(event.type)?.forEach((cb) => cb(event));
      return true;
    },
  };
  // @ts-expect-error — populate the global for the storage module
  globalThis.window = windowMock;
  return store;
}

function deleteDb(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase("joa");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

let lsStore: Map<string, string>;

beforeEach(async () => {
  __resetHistoryForTests();
  await deleteDb();
  lsStore = installWindowMock();
});

afterEach(() => {
  __resetHistoryForTests();
  // @ts-expect-error — cleanup
  delete globalThis.window;
});

describe("history repository (IndexedDB)", () => {
  it("saves to the in-memory cache with no 10-entry cap", () => {
    for (let i = 0; i < 12; i++) saveAnalysis(makeEntry(`e${i}`, 1000 + i));
    const snap = getHistorySnapshot();
    expect(snap).toHaveLength(12);
    // Newest first.
    expect(snap[0].id).toBe("e11");
  });

  it("round-trips an entry through IndexedDB after re-hydration", async () => {
    saveAnalysis(makeEntry("keep", 2000));
    await flush();
    __resetHistoryForTests();
    installWindowMock();
    await hydrateHistory();
    expect(getById("keep")?.jobText).toBe("poste keep");
  });

  it("imports the legacy localStorage blob once, then flags it done", async () => {
    lsStore.set(
      "joa.history.v1",
      JSON.stringify([makeEntry("legacy1", 10), makeEntry("legacy2", 20)])
    );
    await hydrateHistory();
    expect(getHistorySnapshot()).toHaveLength(2);
    expect(lsStore.get("joa.history.migratedToIdb")).toBe("1");

    // A fresh hydrate (new session, legacy blob gone) still reads the data
    // back from IndexedDB — the import is not repeated.
    __resetHistoryForTests();
    installWindowMock();
    await hydrateHistory();
    expect(getHistorySnapshot()).toHaveLength(2);
  });

  it("updateApplication patches the application sub-object", () => {
    saveAnalysis(makeEntry("app", 3000));
    updateApplication("app", { status: "applied" });
    expect(getById("app")?.application?.status).toBe("applied");
  });

  it("deleteAnalysis removes an entry", () => {
    saveAnalysis(makeEntry("a", 1));
    saveAnalysis(makeEntry("b", 2));
    deleteAnalysis("a");
    const snap = getHistorySnapshot();
    expect(snap).toHaveLength(1);
    expect(snap[0].id).toBe("b");
  });
});
