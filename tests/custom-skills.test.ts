import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";
import { LOCAL_SKILLS_DIR, resolveSkills } from "../src/install/writers/skills";

const dirs: string[] = [];

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-cs-"));
  dirs.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "cs-app", dependencies: { "@nestjs/core": "^11.0.0", "@nestjs/common": "^11.0.0" } }),
  );
  return dir;
}

function writeLocalSkill(root: string, name: string, body: string): void {
  const dir = join(root, LOCAL_SKILLS_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), body);
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const opts = {
  agents: ["claude"],
  entryModule: "src/app.module.ts",
  moduleExport: "AppModule",
  architecture: "standard",
  auth: "none",
};

describe("skill-builder generator", () => {
  test("skill-builder is installed by default", () => {
    const dir = makeProject();
    performInstall(dir, detect(dir), opts);
    expect(existsSync(join(dir, ".claude/skills/skill-builder/SKILL.md"))).toBe(true);
  });
});

describe("custom-skills knowledge base", () => {
  test("resolveSkills picks up local skills", () => {
    const dir = makeProject();
    writeLocalSkill(dir, "drizzle-development", "---\nname: drizzle-development\n---\nbody");
    const names = resolveSkills(dir, detect(dir)).map((s) => s.name);
    expect(names).toContain("drizzle-development");
    expect(names).toContain("skill-builder");
  });

  test("install copies a local skill into the agent skills dir", () => {
    const dir = makeProject();
    writeLocalSkill(dir, "drizzle-development", "---\nname: drizzle-development\n---\nMARKER_LOCAL");
    performInstall(dir, detect(dir), opts);
    const copied = join(dir, ".claude/skills/drizzle-development/SKILL.md");
    expect(existsSync(copied)).toBe(true);
    expect(readFileSync(copied, "utf8")).toContain("MARKER_LOCAL");
  });

  test("a local skill overrides a packaged skill of the same name", () => {
    const dir = makeProject();
    writeLocalSkill(dir, "nestjs-docs", "---\nname: nestjs-docs\n---\nCUSTOM_OVERRIDE");
    performInstall(dir, detect(dir), opts);
    const content = readFileSync(join(dir, ".claude/skills/nestjs-docs/SKILL.md"), "utf8");
    expect(content).toContain("CUSTOM_OVERRIDE");
  });
});
