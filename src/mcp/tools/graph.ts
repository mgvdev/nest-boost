import { bootApp } from "../boot";
import { collectModules, type ModuleInfo } from "../introspect";
import { compact, json, type McpTool } from "./types";

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
      format: {
        type: "string",
        enum: ["json", "text"],
        description: "\"text\" returns a compact per-module outline (fewer tokens). Default json.",
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

    if (args.format === "text") {
      return `${boot.project} — ${modules.length} module(s)\n${modules.map(textModule).join("\n")}`;
    }

    return json({
      project: boot.project,
      count: modules.length,
      modules: modules.map((m) =>
        compact({
          name: m.name,
          controllers: m.controllers,
          // Drop the redundant isController/default-scope/exported noise per provider.
          providers: m.providers.map((p) =>
            compact({ name: p.name, scope: p.scope !== "default" ? p.scope : undefined, exported: p.exported || undefined }),
          ),
          imports: m.imports,
          exports: m.exports,
        }),
      ),
    });
  },
};

function textModule(m: ModuleInfo): string {
  const lines = [m.name];
  if (m.controllers.length) lines.push(`  controllers: ${m.controllers.join(", ")}`);
  if (m.providers.length) {
    lines.push(
      `  providers: ${m.providers.map((p) => (p.scope !== "default" ? `${p.name}(${p.scope})` : p.name)).join(", ")}`,
    );
  }
  if (m.imports.length) lines.push(`  imports: ${m.imports.join(", ")}`);
  if (m.exports.length) lines.push(`  exports: ${m.exports.join(", ")}`);
  return lines.join("\n");
}
