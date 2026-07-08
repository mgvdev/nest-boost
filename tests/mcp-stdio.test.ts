import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");
const FIXTURE = join(import.meta.dir, "fixtures", "sample-app");

let client: Client;

beforeAll(async () => {
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", CLI, "mcp"],
    cwd: FIXTURE,
  });
  client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(transport);
});

afterAll(async () => {
  await client?.close();
});

function firstText(result: any): string {
  return result.content.find((c: any) => c.type === "text")?.text ?? "";
}

describe("nest-boost mcp (stdio, real subprocess)", () => {
  test("exposes the expected tools", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "application_info",
      "db_query",
      "db_schema",
      "list_routes",
      "module_graph",
      "nest_cli",
    ]);
  });

  test("application_info returns live introspection", async () => {
    const res = await client.callTool({ name: "application_info", arguments: {} });
    const info = JSON.parse(firstText(res));
    expect(info.runtimeIntrospection.available).toBe(true);
    expect(info.counts.routes).toBe(5);
    expect(info.project.name).toBe("sample-app");
  });

  test("list_routes returns the cats routes", async () => {
    const res = await client.callTool({ name: "list_routes", arguments: { path: "cats" } });
    const { routes } = JSON.parse(firstText(res));
    expect(routes).toHaveLength(3);
    expect(routes.every((r: any) => r.controller === "CatsController")).toBe(true);
  });

  test("module_graph returns CatsModule wiring", async () => {
    const res = await client.callTool({ name: "module_graph", arguments: { module: "CatsModule" } });
    const { modules } = JSON.parse(firstText(res));
    expect(modules[0].exports).toContain("CatsService");
  });
});
