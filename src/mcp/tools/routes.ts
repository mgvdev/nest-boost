import { bootApp } from "../boot";
import { collectRoutes, type RouteInfo } from "../introspect";
import { compact, json, type McpTool } from "./types";

export const routesTool: McpTool = {
  name: "list_routes",
  description:
    "List an application's HTTP routes with method, path, controller, handler, owning module, " +
    "and any guards/interceptors/pipes attached at the class or handler level. Optionally filter " +
    "by HTTP method or a path substring. In a monorepo, pass `project` to target a specific app " +
    "(defaults to the workspace default project).",
  inputSchema: {
    type: "object",
    properties: {
      method: {
        type: "string",
        description: "Filter by HTTP method (GET, POST, ...). Case-insensitive.",
      },
      path: {
        type: "string",
        description: "Only include routes whose path contains this substring.",
      },
      project: {
        type: "string",
        description: "Monorepo application to inspect (defaults to the workspace default project).",
      },
      format: {
        type: "string",
        enum: ["json", "text"],
        description: "\"text\" returns a compact one-line-per-route listing (fewer tokens). Default json.",
      },
    },
    additionalProperties: false,
  },

  async run(args, ctx) {
    const project = typeof args.project === "string" ? args.project : undefined;
    const boot = await bootApp(ctx.projectRoot, project);
    if (!boot.ok) return json({ error: boot.error });

    let routes = collectRoutes(boot.modules);

    const method = typeof args.method === "string" ? args.method.toUpperCase() : undefined;
    if (method) routes = routes.filter((r) => r.method === method);

    const path = typeof args.path === "string" ? args.path : undefined;
    if (path) routes = routes.filter((r) => r.path.includes(path));

    if (args.format === "text") {
      const lines = routes.map(textLine).join("\n");
      return `${boot.project} — ${routes.length} route(s)\n${lines}`;
    }

    // JSON: drop the empty guards/interceptors/pipes arrays that dominate the payload.
    return json({
      project: boot.project,
      count: routes.length,
      routes: routes.map((r) => compact({ ...r })),
    });
  },
};

function textLine(r: RouteInfo): string {
  const enh = [
    r.guards.length ? `guards:${r.guards.join(",")}` : "",
    r.interceptors.length ? `int:${r.interceptors.join(",")}` : "",
    r.pipes.length ? `pipes:${r.pipes.join(",")}` : "",
    r.schemas.length ? `schemas:${r.schemas.map((s) => `${s.index}=${s.library}`).join(",")}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${r.method.padEnd(6)} ${r.path}  →  ${r.controller}.${r.handler}${enh ? "  " + enh : ""}`;
}
