import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CURRENT_PROFILE_VERSION,
  DEFAULT_PROFILE,
} from "@/lib/schemas/profile";

/**
 * Local mock of the Web Storage API + window event target. We mount it on
 * globalThis so the storage module's `typeof window === "undefined"` guard
 * resolves to "object" and proceeds to read/write through this mock.
 */
function installWindowMock() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Set<(e: Event) => void>>();

  const localStorageMock = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };

  const windowMock = {
    localStorage: localStorageMock,
    addEventListener(type: string, cb: (e: Event) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(cb);
    },
    removeEventListener(type: string, cb: (e: Event) => void) {
      listeners.get(type)?.delete(cb);
    },
    dispatchEvent(event: Event) {
      const set = listeners.get(event.type);
      if (set) for (const cb of set) cb(event);
      return true;
    },
  };

  // @ts-expect-error — populating the global for the storage module
  globalThis.window = windowMock;
  // Some code paths (Event ctor) need a global Event class.
  if (typeof globalThis.Event === "undefined") {
    globalThis.Event = class MockEvent {
      readonly type: string;
      constructor(type: string) {
        this.type = type;
      }
    } as unknown as typeof Event;
  }

  return {
    clear: () => {
      store.clear();
      listeners.clear();
    },
    teardown: () => {
      // @ts-expect-error — cleanup
      delete globalThis.window;
    },
  };
}

let mock: ReturnType<typeof installWindowMock>;

beforeEach(async () => {
  mock = installWindowMock();
  // Re-import the storage module fresh so its module-level snapshot cache
  // is reset between tests.
  vi.resetModules();
});

afterEach(() => {
  mock.teardown();
});

async function loadStorage() {
  return await import("./profile");
}

describe("getProfile (default state)", () => {
  it("returns DEFAULT_PROFILE when localStorage is empty", async () => {
    const { getProfile } = await loadStorage();
    const out = getProfile();
    expect(out.stack).toEqual([]);
    expect(out.remotePreference).toBe("any");
    expect(out.weights.salary).toBe(50);
  });

  it("snapshot returns the same reference across calls", async () => {
    const { getProfileSnapshot } = await loadStorage();
    const a = getProfileSnapshot();
    const b = getProfileSnapshot();
    expect(a).toBe(b);
  });
});

describe("updateProfile", () => {
  it("persists a partial patch and stamps the schema version", async () => {
    const { updateProfile, getProfile } = await loadStorage();
    const out = updateProfile({ yearsExperience: 7 });
    expect(out.yearsExperience).toBe(7);
    expect(out.schemaVersion).toBe(CURRENT_PROFILE_VERSION);
    expect(getProfile().yearsExperience).toBe(7);
  });

  it("preserves non-patched fields", async () => {
    const { updateProfile, getProfile } = await loadStorage();
    updateProfile({ yearsExperience: 5 });
    updateProfile({ location: "Paris" });
    const out = getProfile();
    expect(out.yearsExperience).toBe(5);
    expect(out.location).toBe("Paris");
  });

  it("deep-merges weights instead of replacing the whole object", async () => {
    const { updateProfile, getProfile } = await loadStorage();
    updateProfile({
      weights: { ...DEFAULT_PROFILE.weights, salary: 90 },
    });
    updateProfile({
      weights: { ...DEFAULT_PROFILE.weights, salary: 90, remote: 90 },
    });
    const out = getProfile();
    expect(out.weights.salary).toBe(90);
    expect(out.weights.remote).toBe(90);
  });

  it("invalidates the cached snapshot on write", async () => {
    const { updateProfile, getProfileSnapshot } = await loadStorage();
    const before = getProfileSnapshot();
    updateProfile({ location: "Lyon" });
    const after = getProfileSnapshot();
    expect(after).not.toBe(before);
    expect(after.location).toBe("Lyon");
  });
});

describe("resetProfile", () => {
  it("clears all customisations and notifies subscribers", async () => {
    const { updateProfile, resetProfile, subscribeToProfile, getProfile } =
      await loadStorage();
    updateProfile({ yearsExperience: 9, location: "Berlin" });
    expect(getProfile().yearsExperience).toBe(9);

    const listener = vi.fn();
    const unsub = subscribeToProfile(listener);

    resetProfile();
    expect(getProfile().yearsExperience).toBe(0);
    expect(getProfile().location).toBe("");
    expect(listener).toHaveBeenCalled();

    unsub();
  });
});

describe("subscribeToProfile", () => {
  it("notifies on updateProfile and stops after unsub", async () => {
    const { updateProfile, subscribeToProfile } = await loadStorage();
    const listener = vi.fn();
    const unsub = subscribeToProfile(listener);

    updateProfile({ location: "Paris" });
    expect(listener).toHaveBeenCalledTimes(1);

    updateProfile({ location: "Lyon" });
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    updateProfile({ location: "Berlin" });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
