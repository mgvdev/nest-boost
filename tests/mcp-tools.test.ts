import { beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { resetBootCache } from "../src/mcp/boot";
import { appInfoTool } from "../src/mcp/tools/app-info";
import { graphTool } from "../src/mcp/tools/graph";
import { routesTool } from "../src/mcp/tools/routes";
import { lifecycleProbe } from "./fixtures/sample-app/src/app.service";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-app");
const ctx = { projectRoot: FIXTURE };

beforeAll(() => resetBootCache());

describe("application_info tool", () => {
  test("reports versions, packages, and runtime counts", async () => {
    const info = JSON.parse(await appInfoTool.run({}, ctx));
    expect(info.project.name).toBe("sample-app");
    expect(info.nest.major).toBe(12);
    expect(info.runtimeIntrospection.available).toBe(true);
    // AppModule + CatsModule
    expect(info.counts.modules).toBe(2);
    // AppController + CatsController
    expect(info.counts.controllers).toBe(2);
    // 2 GET + health + 3 cats routes = 5
    expect(info.counts.routes).toBe(5);
    expect(info.ecosystem).toContain("typeorm");
  });

  test("preview boot did NOT run lifecycle hooks (no side effects)", () => {
    expect(lifecycleProbe.moduleInitCalled).toBe(false);
  });
});

describe("list_routes tool", () => {
  test("lists all routes with method, path, controller, guards", async () => {
    const { count, routes } = JSON.parse(await routesTool.run({}, ctx));
    expect(count).toBe(5);
    const catsList = routes.find((r: any) => r.path === "/cats" && r.method === "GET");
    expect(catsList.controller).toBe("CatsController");
    expect(catsList.handler).toBe("findAll");
    expect(catsList.module).toBe("CatsModule");
    expect(catsList.guards).toContain("RolesGuard");

    const health = routes.find((r: any) => r.path === "/health");
    expect(health.method).toBe("GET");
    expect(health.guards).toBeUndefined(); // empty arrays are omitted to save tokens
  });

  test("text format is compact and one line per route", async () => {
    const text = await routesTool.run({ format: "text" }, ctx);
    expect(text).toContain("GET");
    expect(text).toContain("/cats  →  CatsController.findAll");
    expect(text).toContain("guards:RolesGuard");
    expect(text.trim().startsWith("{")).toBe(false); // not JSON
  });

  test("filters by method", async () => {
    const { routes } = JSON.parse(await routesTool.run({ method: "post" }, ctx));
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("/cats");
    expect(routes[0].method).toBe("POST");
  });

  test("filters by path substring", async () => {
    const { routes } = JSON.parse(await routesTool.run({ path: "cats" }, ctx));
    expect(routes.every((r: any) => r.path.includes("cats"))).toBe(true);
    expect(routes).toHaveLength(3);
  });

  test("exposes Standard Schema metadata on routes", async () => {
    const { routes } = JSON.parse(await routesTool.run({}, ctx));
    const create = routes.find((r: any) => r.method === "POST" && r.path === "/cats");
    expect(create.schemas).toContainEqual({ index: 0, library: "zod" });
    const findOne = routes.find((r: any) => r.method === "GET" && r.path === "/cats/:id");
    expect(findOne.schemas).toContainEqual({ index: 0, library: "zod" });
  });
});

describe("module_graph tool", () => {
  test("returns modules with providers, imports, exports", async () => {
    const { modules } = JSON.parse(await graphTool.run({}, ctx));
    const cats = modules.find((m: any) => m.name === "CatsModule");
    expect(cats.controllers).toContain("CatsController");
    expect(cats.providers.map((p: any) => p.name)).toContain("CatsService");
    expect(cats.exports).toContain("CatsService");

    const app = modules.find((m: any) => m.name === "AppModule");
    expect(app.imports).toContain("CatsModule");
  });

  test("focuses on a single module when filtered", async () => {
    const { count, modules } = JSON.parse(await graphTool.run({ module: "CatsModule" }, ctx));
    expect(count).toBe(1);
    expect(modules[0].name).toBe("CatsModule");
  });
});
