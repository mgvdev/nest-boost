import { bootApp } from "../boot";
import { collectRoutes } from "../introspect";
import { json, type McpTool } from "./types";

export const routesTool: McpTool = {
  name: "list_routes",
  description:
    "List the application's HTTP routes with method, path, controller, handler, owning module, " +
    "and any guards/interceptors/pipes attached at the class or handler level. Optionally filter " +
    "by HTTP method or a path substring.",
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
    },
    additionalProperties: false,
  },

  async run(args, ctx) {
    const boot = await bootApp(ctx.projectRoot);
    if (!boot.ok) return json({ error: boot.error });

    let routes = collectRoutes(boot.modules);

    const method = typeof args.method === "string" ? args.method.toUpperCase() : undefined;
    if (method) routes = routes.filter((r) => r.method === method);

    const path = typeof args.path === "string" ? args.path : undefined;
    if (path) routes = routes.filter((r) => r.path.includes(path));

    return json({ count: routes.length, routes });
  },
};
