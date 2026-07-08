import { bootApp } from "../boot";
import { collectModules } from "../introspect";
import { json, type McpTool } from "./types";

export const graphTool: McpTool = {
  name: "module_graph",
  description:
    "Inspect an application's dependency-injection graph: every module with its controllers, " +
    "providers (and their scope + whether exported), imported modules, and exported tokens. Use " +
    "this to understand how the application is wired before adding or moving code. Optionally " +
    "focus on one module. In a monorepo, pass `project` to target a specific app (defaults to the " +
    "workspace default project).",
  inputSchema: {
    type: "object",
    properties: {
      module: {
        type: "string",
        description: "Only return this module (by class name, e.g. \"CatsModule\").",
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

    let modules = collectModules(boot.modules);
    const filter = typeof args.module === "string" ? args.module : undefined;
    if (filter) modules = modules.filter((m) => m.name === filter);

    return json({ project: boot.project, count: modules.length, modules });
  },
};
