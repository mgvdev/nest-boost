import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";
import { discoverPackageSkills } from "../src/install/third-party";
import { resolveSkills } from "../src/install/writers/skills";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** A project with a dependency that bundles a skill at the given relative path. */
function makeProjectWithDep(dep: string, skillRelDir: string, skillName: string, depPkg: object = {}): string {
  const root = mkdtempSync(join(tmpdir(), "nest-boost-tp-"));
  dirs.push(root);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "host", dependencies: { "@nestjs/core": "^11.0.0", "@nestjs/common": "^11.0.0", [dep]: "^1.0.0" } }),
  );
  const depDir = join(root, "node_modules", ...dep.split("/"));
  mkdirSync(depDir, { recursive: true });
  writeFileSync(join(depDir, "package.json"), JSON.stringify({ name: dep, version: "1.0.0", ...depPkg }));
  const skillDir = join(depDir, skillRelDir, skillName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), `---\nname: ${skillName}\n---\nMARKER_${skillName}`);
  return root;
}

describe("third-party package skills", () => {
  test("discovers a skill under the conventional skill/ folder (nestjs-ai layout)", () => {
    const root = makeProjectWithDep("@mgvdev/nestjs-ai", "skill", "nestjs-ai");
    const found = discoverPackageSkills(root);
    expect(found.map((s) => s.name)).toContain("nestjs-ai");
    expect(resolveSkills(root, detect(root)).map((s) => s.name)).toContain("nestjs-ai");
  });

  test("discovers a skill via an explicit nestBoost.skills field", () => {
    const root = makeProjectWithDep("@acme/thing", "custom-skills", "acme-thing", {
      nestBoost: { skills: ["custom-skills"] },
    });
    expect(discoverPackageSkills(root).map((s) => s.name)).toContain("acme-thing");
  });

  test("install copies the bundled skill into the agent skills dir", () => {
    const root = makeProjectWithDep("@mgvdev/nestjs-ai", "skill", "nestjs-ai");
    performInstall(root, detect(root), {
      agents: ["claude"],
      projects: [{ name: "app", type: "application", root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
      defaultProject: "app",
      architecture: "standard",
      auth: "none",
      runner: "bunx",
    });
    const copied = join(root, ".claude/skills/nestjs-ai/SKILL.md");
    expect(existsSync(copied)).toBe(true);
    expect(readFileSync(copied, "utf8")).toContain("MARKER_nestjs-ai");
  });

  test("ignores dependencies without a bundled skill", () => {
    const root = mkdtempSync(join(tmpdir(), "nest-boost-tp-"));
    dirs.push(root);
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "host", dependencies: { "@nestjs/core": "^11.0.0" } }));
    mkdirSync(join(root, "node_modules/@nestjs/core"), { recursive: true });
    writeFileSync(join(root, "node_modules/@nestjs/core/package.json"), JSON.stringify({ name: "@nestjs/core" }));
    expect(discoverPackageSkills(root)).toEqual([]);
  });
});
