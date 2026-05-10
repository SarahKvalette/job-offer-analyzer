import { describe, it, expect } from "vitest";
import { inferBenchmarkRole } from "./role-inference";

describe("inferBenchmarkRole", () => {
  it("detects fullstack before frontend/backend", () => {
    expect(inferBenchmarkRole("Senior Fullstack Engineer")).toBe("fullstack");
    expect(inferBenchmarkRole("Full-stack developer")).toBe("fullstack");
    expect(inferBenchmarkRole("Full Stack TypeScript Engineer")).toBe("fullstack");
  });

  it("detects frontend roles", () => {
    expect(inferBenchmarkRole("Senior Frontend Engineer")).toBe("frontend");
    expect(inferBenchmarkRole("React developer")).toBe("frontend");
    expect(inferBenchmarkRole("Vue.js Engineer")).toBe("frontend");
  });

  it("detects backend roles", () => {
    expect(inferBenchmarkRole("Backend Engineer")).toBe("backend");
    expect(inferBenchmarkRole("Senior API Engineer")).toBe("backend");
  });

  it("detects data roles", () => {
    expect(inferBenchmarkRole("Data Engineer")).toBe("data");
    expect(inferBenchmarkRole("ML Engineer")).toBe("data");
    expect(inferBenchmarkRole("Senior Data Scientist")).toBe("data");
    expect(inferBenchmarkRole("Analytics Engineer")).toBe("data");
  });

  it("detects devops roles", () => {
    expect(inferBenchmarkRole("DevOps Engineer")).toBe("devops");
    expect(inferBenchmarkRole("Site Reliability Engineer")).toBe("devops");
    expect(inferBenchmarkRole("Platform Engineer")).toBe("devops");
    expect(inferBenchmarkRole("SRE")).toBe("devops");
  });

  it("detects mobile roles", () => {
    expect(inferBenchmarkRole("iOS Engineer")).toBe("mobile");
    expect(inferBenchmarkRole("Android Developer")).toBe("mobile");
    expect(inferBenchmarkRole("React Native Engineer")).toBe("mobile");
  });

  it("returns null when no heuristic matches", () => {
    expect(inferBenchmarkRole("Software Engineer")).toBeNull();
    expect(inferBenchmarkRole("CTO")).toBeNull();
    expect(inferBenchmarkRole("")).toBeNull();
  });
});
