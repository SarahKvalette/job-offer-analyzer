import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const TEST_SECRET = "a-strong-secret-for-tests";

beforeEach(() => {
  vi.resetModules();
  process.env.JOA_OWNER_SECRET = TEST_SECRET;
});

afterEach(() => {
  delete process.env.JOA_OWNER_SECRET;
});

async function loadAuth() {
  // next/headers's `cookies()` reads from an AsyncLocalStorage that only
  // works inside the Next request context. We stub it for the helpers we
  // care about — verifyPassword + buildOwnerCookieValue are pure.
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      get: () => undefined,
      set: () => undefined,
      delete: () => undefined,
    }),
  }));
  return await import("./owner-auth");
}

describe("verifyPassword", () => {
  it("accepts the exact secret", async () => {
    const auth = await loadAuth();
    expect(auth.verifyPassword(TEST_SECRET)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const auth = await loadAuth();
    expect(auth.verifyPassword("nope")).toBe(false);
  });

  it("rejects an empty submission", async () => {
    const auth = await loadAuth();
    expect(auth.verifyPassword("")).toBe(false);
  });

  it("rejects when JOA_OWNER_SECRET is missing", async () => {
    delete process.env.JOA_OWNER_SECRET;
    const auth = await loadAuth();
    expect(auth.verifyPassword("anything")).toBe(false);
  });

  it("rejects same-prefix attempts (no timing-attack surface)", async () => {
    const auth = await loadAuth();
    expect(auth.verifyPassword(TEST_SECRET.slice(0, -1))).toBe(false);
    expect(auth.verifyPassword(TEST_SECRET + "x")).toBe(false);
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
