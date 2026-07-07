import { detect } from "../../install/detect";
import { bootApp } from "../boot";
import { collectModules, collectRoutes, countModules } from "../introspect";
import { json, type McpTool } from "./types";

export const appInfoTool: McpTool = {
  name: "application_info",
  description:
    "Read the NestJS application's runtime and ecosystem context: Bun/Node/Nest versions, " +
    "detected ecosystem packages with versions, and counts of modules, controllers, providers, " +
    "and routes. Call this first to understand the shape of the project.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },

  async run(_args, ctx) {
    const detection = detect(ctx.projectRoot);
    const boot = await bootApp(ctx.projectRoot);

    const base = {
      project: detection.project,
      runtime: detection.runtime,
      nest: detection.nest,
      packages: detection.packages,
      ecosystem: detection.entries.map((e) => e.id),
    };

    if (!boot.ok) {
      return json({ ...base, runtimeIntrospection: { available: false, reason: boot.error } });
    }

    const modules = collectModules(boot.modules);
    const routes = collectRoutes(boot.modules);
    return json({
      ...base,
      counts: {
        modules: countModules(boot.modules),
        controllers: modules.reduce((n, m) => n + m.controllers.length, 0),
        providers: modules.reduce((n, m) => n + m.providers.length, 0),
        routes: routes.length,
      },
      runtimeIntrospection: { available: true },
    });
  },
};
