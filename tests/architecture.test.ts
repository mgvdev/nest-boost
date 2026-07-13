import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";
import { composeGuidelines } from "../src/install/writers/guidelines";
import { skillsForDetection } from "../src/install/writers/skills";

const dirs: string[] = [];

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-arch-"));
  dirs.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "arch-app",
      dependencies: { "@nestjs/core": "^12.0.0", "@nestjs/common": "^12.0.0" },
    }),
  );
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("architecture selection", () => {
  test("composeGuidelines includes the chosen architecture section", () => {
    const dir = makeProject();
    const d = detect(dir);
    expect(composeGuidelines(d, { architecture: "cqrs" })).toContain("Architecture: CQRS");
    expect(composeGuidelines(d, { architecture: "hexagonal" })).toContain("Architecture: Hexagonal");
    expect(composeGuidelines(d, { architecture: "standard" })).toContain("Architecture: Standard");
  });

  test("skillsForDetection includes the architecture skill", () => {
    const d = detect(makeProject());
    expect(skillsForDetection(d, { architecture: "cqrs" })).toContain("architecture-cqrs");
    expect(skillsForDetection(d, { architecture: "hexagonal" })).toContain("architecture-hexagonal");
    expect(skillsForDetection(d, { architecture: "cqrs" })).not.toContain("architecture-hexagonal");
  });

  test("install adapts guidelines + skills to CQRS", () => {
    const dir = makeProject();
    performInstall(dir, detect(dir), {
      agents: ["claude"],
      projects: [{ name: "app", type: "application", root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
      defaultProject: "app",
      architecture: "cqrs",
      auth: "none",
      runner: "bunx",
    });

    const claude = readFileSync(join(dir, "CLAUDE.md"), "utf8");
    expect(claude).toContain("Architecture: CQRS");
    expect(claude).not.toContain("Architecture: Hexagonal");

    expect(existsSync(join(dir, ".claude/skills/architecture-cqrs/SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".claude/skills/architecture-hexagonal"))).toBe(false);

    const config = JSON.parse(readFileSync(join(dir, "nest-boost.json"), "utf8"));
    expect(config.architecture).toBe("cqrs");
  });

  test("install adapts to Hexagonal", () => {
    const dir = makeProject();
    performInstall(dir, detect(dir), {
      agents: ["claude"],
      projects: [{ name: "app", type: "application", root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
      defaultProject: "app",
      architecture: "hexagonal",
      auth: "none",
      runner: "bunx",
    });
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toContain("ports & adapters");
    expect(existsSync(join(dir, ".claude/skills/architecture-hexagonal/SKILL.md"))).toBe(true);
  });
});
