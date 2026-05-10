import { describe, it, expect } from "vitest";
import {
  TECH_STACKS,
  searchStacks,
  findStackById,
  labelFor,
  CATEGORY_LABELS,
} from "./tech-stacks";

describe("TECH_STACKS dataset", () => {
  it("has at least 70 entries", () => {
    expect(TECH_STACKS.length).toBeGreaterThanOrEqual(70);
  });

  it("has unique ids", () => {
    const ids = TECH_STACKS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every id follows the 'category:slug' convention", () => {
    for (const entry of TECH_STACKS) {
      expect(entry.id).toMatch(/^[a-z]+:[a-z0-9.+-]+$/);
      expect(entry.id.split(":")[0]).toBe(entry.category);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const entry of TECH_STACKS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("searchStacks", () => {
  it("returns the whole dataset grouped when query is empty", () => {
    const groups = searchStacks("");
    const total = groups.reduce((acc, g) => acc + g.entries.length, 0);
    expect(total).toBe(TECH_STACKS.length);
    expect(groups[0].label).toBe(CATEGORY_LABELS.language);
  });

  it("matches by label substring", () => {
    const groups = searchStacks("react");
    const flat = groups.flatMap((g) => g.entries);
    expect(flat.find((e) => e.id === "frontend:react")).toBeDefined();
    expect(flat.find((e) => e.id === "mobile:reactnative")).toBeDefined();
  });

  it("matches by alias", () => {
    const groups = searchStacks("k8s");
    const flat = groups.flatMap((g) => g.entries);
    expect(flat.find((e) => e.id === "devops:kubernetes")).toBeDefined();
  });

  it("is accent-insensitive", () => {
    // The dataset doesn't contain accents but the helper itself must be
    // accent-insensitive so future entries (or the FR migration) work.
    expect(searchStacks("typescript").length).toBeGreaterThan(0);
    expect(searchStacks("typéscript").length).toBeGreaterThan(0);
  });

  it("returns empty array on no matches", () => {
    expect(searchStacks("zzzzzzz")).toEqual([]);
  });

  it("preserves category ordering", () => {
    const groups = searchStacks("");
    const order = groups.map((g) => g.label);
    expect(order[0]).toBe(CATEGORY_LABELS.language);
    expect(order[order.length - 1]).toBe(CATEGORY_LABELS.tools);
  });
});

describe("findStackById + labelFor", () => {
  it("findStackById returns the matching entry", () => {
    expect(findStackById("frontend:react")?.label).toBe("React");
  });

  it("findStackById returns null for unknown id", () => {
    expect(findStackById("xyz:nope")).toBeNull();
  });

  it("labelFor strips the 'custom:' prefix", () => {
    expect(labelFor("custom:My Internal Tool")).toBe("My Internal Tool");
  });

  it("labelFor returns the dataset label for known ids", () => {
    expect(labelFor("backend:nodejs")).toBe("Node.js");
  });

  it("labelFor falls back to the raw id for unknowns", () => {
    expect(labelFor("xyz:nope")).toBe("xyz:nope");
  });
});
