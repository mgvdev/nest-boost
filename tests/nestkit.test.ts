import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detect } from "../src/install/detect";
import { findEntryModuleIn } from "../src/install/entry";
import { readNestkitWorkspace } from "../src/install/nestkit";
import { composeGuidelines } from "../src/install/writers/guidelines";
import { skillsForDetection } from "../src/install/writers/skills";
import { skillsDir } from "../src/lib/resources";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** Build a minimal NestKit workspace: apps/api (app) + packages/shared (lib). */
function makeNestkitWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), "nest-boost-nk-"));
  dirs.push(root);
  const w = (p: string, c: string) => {
    mkdirSync(join(root, p, ".."), { recursive: true });
    writeFileSync(join(root, p), c);
  };

  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      name: "nk-workspace",
      workspaces: ["apps/*", "packages/*"],
      dependencies: { "@mgvdev/nestkit-cli": "^1.0.0", "@nestjs/core": "^11.0.0", "@nestjs/common": "^11.0.0" },
    }),
  );

  mkdirSync(join(root, "apps/api/src"), { recursive: true });
  writeFileSync(join(root, "apps/api/nestkit.json"), JSON.stringify({ type: "app", entry: "src/main.ts" }));
  writeFileSync(join(root, "apps/api/package.json"), JSON.stringify({ name: "api" }));
  writeFileSync(
    join(root, "apps/api/src/main.ts"),
    `import { NestFactory } from "@nestjs/core";\nimport { ApiModule } from "./api.module";\nNestFactory.create(ApiModule);\n`,
  );
  writeFileSync(join(root, "apps/api/src/api.module.ts"), `export class ApiModule {}\n`);

  mkdirSync(join(root, "packages/shared/src"), { recursive: true });
  writeFileSync(join(root, "packages/shared/nestkit.json"), JSON.stringify({ type: "lib" }));
  writeFileSync(join(root, "packages/shared/package.json"), JSON.stringify({ name: "@nk/shared" }));

  return root;
}

describe("readNestkitWorkspace", () => {
  test("detects the workspace, engine, projects, and default", () => {
    const ws = readNestkitWorkspace(makeNestkitWorkspace());
    expect(ws.monorepo).toBe(true);
    expect(ws.engine).toBe("nestkit");
    expect(ws.defaultProject).toBe("api");
    expect(ws.projects.map((p) => `${p.name}:${p.type}`).sort()).toEqual(["@nk/shared:library", "api:application"]);
    const api = ws.projects.find((p) => p.name === "api")!;
    expect(api.sourceRoot).toBe("apps/api/src");
    expect(api.entryFile).toBe("main");
  });

  test("resolves an app's entry module from its sourceRoot", () => {
    const root = makeNestkitWorkspace();
    const entry = findEntryModuleIn(root, { sourceRoot: "apps/api/src", entryFile: "main" });
    expect(entry.entryModule).toBe("apps/api/src/api.module.ts");
    expect(entry.moduleExport).toBe("ApiModule");
  });

  test("not a nestkit workspace without deps or nestkit.json", () => {
    const empty = mkdtempSync(join(tmpdir(), "nest-boost-nk0-"));
    dirs.push(empty);
    writeFileSync(join(empty, "package.json"), JSON.stringify({ name: "x" }));
    expect(readNestkitWorkspace(empty).monorepo).toBe(false);
  });
});

describe("detect + skill for NestKit", () => {
  test("surfaces a NestKit monorepo and installs the skill + guideline", () => {
    const root = makeNestkitWorkspace();
    const d = detect(root);
    expect(d.monorepo).toBe(true);
    expect(d.workspaceEngine).toBe("nestkit");
    expect(d.entries.map((e) => e.id)).toContain("nestkit");
    expect(skillsForDetection(d)).toContain("nestkit-development");
    expect(existsSync(join(skillsDir(), "nestkit-development", "SKILL.md"))).toBe(true);
    expect(composeGuidelines(d)).toContain("NestKit Workspace");
  });
});
