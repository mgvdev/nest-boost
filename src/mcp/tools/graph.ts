import { bootApp } from "../boot";
import { collectModules } from "../introspect";
import { json, type McpTool } from "./types";

export const graphTool: McpTool = {
  name: "module_graph",
  description:
    "Inspect the NestJS dependency-injection graph: every module with its controllers, providers " +
    "(and their scope + whether exported), imported modules, and exported tokens. Use this to " +
    "understand how the application is wired before adding or moving code. Optionally focus on one module.",
  inputSchema: {
    type: "object",
    properties: {
      module: {
        type: "string",
        description: "Only return this module (by class name, e.g. \"CatsModule\").",
      },
    },
    additionalProperties: false,
  },

  async run(args, ctx) {
    const boot = await bootApp(ctx.projectRoot);
    if (!boot.ok) return json({ error: boot.error });

    let modules = collectModules(boot.modules);
    const filter = typeof args.module === "string" ? args.module : undefined;
    if (filter) modules = modules.filter((m) => m.name === filter);

    return json({ count: modules.length, modules });
  },
};
