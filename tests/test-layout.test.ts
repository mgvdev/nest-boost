import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";
import { composeGuidelines } from "../src/install/writers/guidelines";
import { skillsForDetection } from "../src/install/writers/skills";
import { skillsDir } from "../src/lib/resources";

const dirs: string[] = [];
function makeProject(deps: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-tl-"));
  dirs.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "tl", dependencies: { "@nestjs/core": "^12.0.0", "@nestjs/common": "^12.0.0", ...deps } }),
  );
  return dir;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("suites skill", () => {
  test("packaged skill exists", () => {
    expect(existsSync(join(skillsDir(), "suites-testing", "SKILL.md"))).toBe(true);
  });
  test("detected + installed when @suites/unit present", () => {
    const d = detect(makeProject({ "@suites/unit": "^3.0.0" }));
    expect(d.entries.map((e) => e.id)).toContain("suites");
    expect(skillsForDetection(d)).toContain("suites-testing");
  });
});

describe("test-layout guideline composition", () => {
  test("includes the chosen layout section", () => {
    const d = detect(makeProject());
    expect(composeGuidelines(d, { testLayout: "central" })).toContain("Central `test/` folder");
    expect(composeGuidelines(d, { testLayout: "colocated-subfolder" })).toContain("__tests__");
    expect(composeGuidelines(d, { testLayout: "colocated" })).toContain("Colocated (Nest default)");
  });
});

describe("install persists test layout", () => {
  const opts = {
    agents: ["claude"],
    projects: [{ name: "app", type: "application" as const, root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
    defaultProject: "app",
    architecture: "standard",
    auth: "none",
    runner: "bunx" as const,
  };

  test("saves testLayout and composes its guideline", () => {
    const dir = makeProject();
    performInstall(dir, detect(dir), { ...opts, testLayout: "central" });
    const config = JSON.parse(readFileSync(join(dir, "nest-boost.json"), "utf8"));
    expect(config.testLayout).toBe("central");
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toContain("Central `test/` folder");
  });

  test("defaults to colocated when omitted", () => {
    const dir = makeProject();
    performInstall(dir, detect(dir), opts);
    const config = JSON.parse(readFileSync(join(dir, "nest-boost.json"), "utf8"));
    expect(config.testLayout).toBe("colocated");
  });
});
