import { bootApp } from "../boot";
import { collectRoutes } from "../introspect";
import { json, type McpTool } from "./types";

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

    return json({ project: boot.project, count: routes.length, routes });
  },
};
