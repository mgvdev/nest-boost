import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { detect, isNestProject } from "../src/install/detect";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-app");

describe("detect", () => {
  const result = detect(FIXTURE);

  test("identifies the project", () => {
    expect(result.project.name).toBe("sample-app");
    expect(result.project.version).toBe("1.2.3");
  });

  test("recognises it as a NestJS project", () => {
    expect(isNestProject(result)).toBe(true);
  });

  test("resolves the installed @nestjs/core version and major", () => {
    // The fixture resolves nest from the repo's installed node_modules (v12).
    expect(result.nest?.major).toBe(12);
    expect(result.nest?.version).toMatch(/^12\./);
  });

  test("detects the ecosystem entries present in the manifest", () => {
    const ids = result.entries.map((e) => e.id).sort();
    expect(ids).toContain("nestjs");
    expect(ids).toContain("config");
    expect(ids).toContain("typeorm");
    expect(ids).toContain("validation");
    expect(ids).toContain("testing");
    expect(ids).toContain("zod");
  });

  test("does not detect packages that are absent", () => {
    const ids = result.entries.map((e) => e.id);
    expect(ids).not.toContain("prisma");
    expect(ids).not.toContain("graphql");
    expect(ids).not.toContain("mongoose");
  });

  test("lists detected packages with resolved versions", () => {
    const typeorm = result.packages.find((p) => p.name === "typeorm");
    expect(typeorm).toBeDefined();
    expect(typeorm?.version).toBeTruthy();
  });

  test("captures the bun runtime version", () => {
    expect(result.runtime.bun).toBeTruthy();
  });
});
