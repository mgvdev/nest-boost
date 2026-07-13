import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { loadConfig } from "../src/install/config";
import { detect } from "../src/install/detect";
import { findEntryModuleIn } from "../src/install/entry";
import { readWorkspace } from "../src/install/nest-cli";
import { resetBootCache } from "../src/mcp/boot";
import { appInfoTool } from "../src/mcp/tools/app-info";
import { graphTool } from "../src/mcp/tools/graph";
import { routesTool } from "../src/mcp/tools/routes";

const FIXTURE = join(import.meta.dir, "fixtures", "monorepo-app");
const ctx = { projectRoot: FIXTURE };

beforeEach(() => resetBootCache());

describe("readWorkspace", () => {
  const ws = readWorkspace(FIXTURE);

  test("detects the monorepo, its projects, and the default project", () => {
    expect(ws.monorepo).toBe(true);
    expect(ws.defaultProject).toBe("api");
    expect(ws.projects.map((p) => p.name).sort()).toEqual(["api", "shared", "worker"]);
    expect(ws.projects.find((p) => p.name === "shared")?.type).toBe("library");
    expect(ws.projects.find((p) => p.name === "worker")?.type).toBe("application");
  });
});

describe("findEntryModuleIn", () => {
  test("resolves each app's root module from its sourceRoot", () => {
    const api = findEntryModuleIn(FIXTURE, { sourceRoot: "apps/api/src", entryFile: "main" });
    expect(api.entryModule).toBe("apps/api/src/api.module.ts");
    expect(api.moduleExport).toBe("ApiModule");

    const worker = findEntryModuleIn(FIXTURE, { sourceRoot: "apps/worker/src", entryFile: "main" });
    expect(worker.entryModule).toBe("apps/worker/src/worker.module.ts");
    expect(worker.moduleExport).toBe("WorkerModule");
  });
});

describe("detect (monorepo)", () => {
  test("surfaces monorepo + projects", () => {
    const d = detect(FIXTURE);
    expect(d.monorepo).toBe(true);
    expect(d.defaultProject).toBe("api");
    expect(d.projects).toHaveLength(3);
  });
});

describe("per-project MCP introspection", () => {
  test("application_info lists all projects and counts the default", async () => {
    const info = JSON.parse(await appInfoTool.run({}, ctx));
    expect(info.workspace.monorepo).toBe(true);
    expect(info.workspace.defaultProject).toBe("api");
    expect(info.workspace.projects.map((p: any) => p.name).sort()).toEqual(["api", "shared", "worker"]);
    expect(info.counts.project).toBe("api");
    // api: GET /users, GET /users/:id
    expect(info.counts.routes).toBe(2);
  });

  test("list_routes targets the requested app", async () => {
    const api = JSON.parse(await routesTool.run({ project: "api" }, ctx));
    expect(api.project).toBe("api");
    expect(api.routes.map((r: any) => r.path).sort()).toEqual(["/users", "/users/:id"]);
    expect(api.routes.find((r: any) => r.path === "/users").guards).toContain("ApiKeyGuard");

    const worker = JSON.parse(await routesTool.run({ project: "worker" }, ctx));
    expect(worker.project).toBe("worker");
    expect(worker.routes).toHaveLength(1);
    expect(worker.routes[0].path).toBe("/jobs/run");
    expect(worker.routes[0].method).toBe("POST");
  });

  test("omitting project uses the default (api)", async () => {
    const def = JSON.parse(await routesTool.run({}, ctx));
    expect(def.project).toBe("api");
  });

  test("module_graph shows the imported library's provider in the app graph", async () => {
    const graph = JSON.parse(await graphTool.run({ project: "api" }, ctx));
    const names = graph.modules.map((m: any) => m.name);
    expect(names).toContain("ApiModule");
    expect(names).toContain("SharedModule"); // library module appears via import
    const shared = graph.modules.find((m: any) => m.name === "SharedModule");
    expect(shared.exports).toContain("SharedService");
  });

  test("booting a library returns a clear error", async () => {
    const res = JSON.parse(await routesTool.run({ project: "shared" }, ctx));
    expect(res.error).toContain("library");
  });

  test("an unknown project errors with the available list", async () => {
    const res = JSON.parse(await graphTool.run({ project: "nope" }, ctx));
    expect(res.error).toContain("Unknown project");
    expect(res.error).toContain("api");
  });
});

describe("config migration + install shape", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "nest-boost-mono-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  test("legacy single-app config is migrated to projects[]", () => {
    writeFileSync(
      join(dir, "nest-boost.json"),
      JSON.stringify({ entryModule: "src/app.module.ts", moduleExport: "AppModule", agents: ["claude"] }),
    );
    const config = loadConfig(dir)!;
    expect(config.projects).toHaveLength(1);
    expect(config.projects[0].entryModule).toBe("src/app.module.ts");
    expect(config.defaultProject).toBe("app");
  });

  test("install writes projects + defaultProject and the monorepo guideline", () => {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "m", dependencies: { "@nestjs/core": "^12.0.0", "@nestjs/common": "^12.0.0" } }),
    );
    writeFileSync(
      join(dir, "nest-cli.json"),
      JSON.stringify({
        monorepo: true,
        root: "apps/api",
        projects: {
          api: { type: "application", root: "apps/api", sourceRoot: "apps/api/src", entryFile: "main" },
          worker: { type: "application", root: "apps/worker", sourceRoot: "apps/worker/src", entryFile: "main" },
          shared: { type: "library", root: "libs/shared", sourceRoot: "libs/shared/src", entryFile: "index" },
        },
      }),
    );

    performInstall(dir, detect(dir), {
      agents: ["claude"],
      projects: [
        { name: "api", type: "application", root: "apps/api", entryModule: "apps/api/src/api.module.ts", moduleExport: "ApiModule" },
        { name: "worker", type: "application", root: "apps/worker", entryModule: "apps/worker/src/worker.module.ts", moduleExport: "WorkerModule" },
        { name: "shared", type: "library", root: "libs/shared" },
      ],
      defaultProject: "api",
      architecture: "standard",
      auth: "none",
      runner: "bunx",
    });

    const config = JSON.parse(readFileSync(join(dir, "nest-boost.json"), "utf8"));
    expect(config.projects).toHaveLength(3);
    expect(config.defaultProject).toBe("api");
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(true);
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toContain("NestJS Monorepo Workspace");
  });
});
