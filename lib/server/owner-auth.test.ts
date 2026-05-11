import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const TEST_SECRET = "a-strong-secret-for-tests";

beforeEach(() => {
  vi.resetModules();
  process.env.JOA_OWNER_SECRET = TEST_SECRET;
});

afterEach(() => {
  delete process.env.JOA_OWNER_SECRET;
  delete process.env.JOA_OWNER_EMAIL;
});

async function loadAuth() {
  // next/headers's `cookies()` reads from an AsyncLocalStorage that only
  // works inside the Next request context. We stub it for the pure
  // helpers we exercise here.
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      get: () => undefined,
      set: () => undefined,
      delete: () => undefined,
    }),
  }));
  return await import("./owner-auth");
}

describe("isEmailAllowed", () => {
  it("rejects every email when JOA_OWNER_EMAIL is unset", async () => {
    delete process.env.JOA_OWNER_EMAIL;
    const auth = await loadAuth();
    expect(auth.isEmailAllowed("sarah@example.com")).toBe(false);
  });

  it("accepts the configured email", async () => {
    process.env.JOA_OWNER_EMAIL = "sarah@example.com";
    const auth = await loadAuth();
    expect(auth.isEmailAllowed("sarah@example.com")).toBe(true);
  });

  it("is case-insensitive and tolerates surrounding whitespace", async () => {
    process.env.JOA_OWNER_EMAIL = "  Sarah@Example.COM ";
    const auth = await loadAuth();
    expect(auth.isEmailAllowed("sarah@example.com")).toBe(true);
    expect(auth.isEmailAllowed("SARAH@example.com")).toBe(true);
  });

  it("supports a comma-separated allowlist", async () => {
    process.env.JOA_OWNER_EMAIL = "a@example.com, b@example.com";
    const auth = await loadAuth();
    expect(auth.isEmailAllowed("a@example.com")).toBe(true);
    expect(auth.isEmailAllowed("b@example.com")).toBe(true);
    expect(auth.isEmailAllowed("c@example.com")).toBe(false);
  });

  it("rejects null / empty submissions", async () => {
    process.env.JOA_OWNER_EMAIL = "sarah@example.com";
    const auth = await loadAuth();
    expect(auth.isEmailAllowed(null)).toBe(false);
    expect(auth.isEmailAllowed("")).toBe(false);
    expect(auth.isEmailAllowed(undefined)).toBe(false);
  });
});

describe("buildOwnerCookieValue", () => {
  it("returns a token of shape `owner.<hex64>`", async () => {
    const auth = await loadAuth();
    const token = auth.buildOwnerCookieValue();
    expect(token.startsWith("owner.")).toBe(true);
    const sig = token.slice("owner.".length);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("token signature matches HMAC-SHA256 with the configured secret", async () => {
    const auth = await loadAuth();
    const token = auth.buildOwnerCookieValue();
    const sig = token.slice("owner.".length);
    const expected = createHmac("sha256", TEST_SECRET)
      .update("owner")
      .digest("hex");
    expect(sig).toBe(expected);
  });

  it("changes after rotating the secret", async () => {
    let auth = await loadAuth();
    const tokenA = auth.buildOwnerCookieValue();
    process.env.JOA_OWNER_SECRET = "a-different-secret-value";
    vi.resetModules();
    auth = await loadAuth();
    const tokenB = auth.buildOwnerCookieValue();
    expect(tokenA).not.toBe(tokenB);
  });
});
