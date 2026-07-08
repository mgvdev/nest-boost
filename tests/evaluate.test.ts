import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { resetEvaluateCache } from "../src/mcp/evaluate/boot-full";
import { evaluateTool } from "../src/mcp/tools/evaluate";
import { skillsForDetection } from "../src/install/writers/skills";
import { detect } from "../src/install/detect";
import { skillsDir } from "../src/lib/resources";

const FIXTURE = join(import.meta.dir, "fixtures", "eval-app");
const ctx = { projectRoot: FIXTURE };

beforeEach(() => resetEvaluateCache());
afterAll(() => resetEvaluateCache());

describe("evaluate tool", () => {
  test("evaluates a plain expression", async () => {
    const res = JSON.parse(await evaluateTool.run({ code: "1 + 2" }, ctx));
    expect(res.result).toBe(3);
    expect(res.project).toBe("app");
  });

  test("resolves a provider via $() and awaits", async () => {
    const res = JSON.parse(await evaluateTool.run({ code: "await $(MathService).double(21)" }, ctx));
    expect(res.result).toBe(42);
  });

  test("exposes provider classes by name and serializes objects", async () => {
    const res = JSON.parse(await evaluateTool.run({ code: "$(MathService).users()" }, ctx));
    expect(res.result).toEqual([
      { id: 1, name: "Ada" },
      { id: 2, name: "Alan" },
    ]);
    expect(res.availableProviders).toBeGreaterThan(0);
  });

  test("resolves a provider by string name", async () => {
    const res = JSON.parse(await evaluateTool.run({ code: "$('MathService').add(1, 2)" }, ctx));
    expect(res.result).toBe(3);
  });

  test("supports statements ending in return", async () => {
    const res = JSON.parse(
      await evaluateTool.run({ code: "const s = $(MathService); return s.add(2, 40);" }, ctx),
    );
    expect(res.result).toBe(42);
  });

  test("reports evaluation errors without crashing", async () => {
    const res = JSON.parse(await evaluateTool.run({ code: "return $(MathService).nope()" }, ctx));
    expect(res.error).toBeTruthy();
  });

  test("ships a baseline using-evaluate skill", () => {
    expect(existsSync(join(skillsDir(), "using-evaluate", "SKILL.md"))).toBe(true);
    expect(skillsForDetection(detect(FIXTURE))).toContain("using-evaluate");
  });

  test("is disabled only when explicitly turned off", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nest-boost-noeval-"));
    writeFileSync(
      join(dir, "nest-boost.json"),
      JSON.stringify({ agents: [], evaluate: { enabled: false } }),
    );
    try {
      const res = JSON.parse(await evaluateTool.run({ code: "1+1" }, { projectRoot: dir }));
      expect(res.error).toContain("disabled");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("is blocked when NODE_ENV=production", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = JSON.parse(await evaluateTool.run({ code: "1+1" }, ctx));
      expect(res.error).toContain("production");
    } finally {
      if (prev === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prev;
    }
  });
});
