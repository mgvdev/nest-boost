import { detect } from "../../install/detect";
import { bootApp } from "../boot";
import { collectModules, collectRoutes, countModules } from "../introspect";
import { json, type McpTool } from "./types";

export const appInfoTool: McpTool = {
  name: "application_info",
  description:
    "Read the NestJS project's runtime and ecosystem context: Bun/Node/Nest versions, " +
    "detected ecosystem packages with versions, the workspace layout (apps + libraries in a " +
    "monorepo), and counts of modules/controllers/providers/routes for one application. " +
    "Call this first. In a monorepo, pass `project` to inspect a specific app; omitted uses " +
    "the default project.",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "Monorepo application to count (defaults to the workspace default project).",
      },
    },
    additionalProperties: false,
  },

  async run(args, ctx) {
    const detection = detect(ctx.projectRoot);
    const project = typeof args.project === "string" ? args.project : undefined;
    const boot = await bootApp(ctx.projectRoot, project);

    const base = {
      project: detection.project,
      runtime: detection.runtime,
      nest: detection.nest,
      packages: detection.packages,
      ecosystem: detection.entries.map((e) => e.id),
      workspace: {
        monorepo: detection.monorepo,
        defaultProject: detection.defaultProject,
        projects: detection.projects.map((p) => ({ name: p.name, type: p.type, root: p.root })),
      },
    };

    if (!boot.ok) {
      return json({ ...base, runtimeIntrospection: { available: false, reason: boot.error } });
    }

    const modules = collectModules(boot.modules);
    const routes = collectRoutes(boot.modules);
    return json({
      ...base,
      counts: {
        project: boot.project,
        modules: countModules(boot.modules),
        controllers: modules.reduce((n, m) => n + m.controllers.length, 0),
        providers: modules.reduce((n, m) => n + m.providers.length, 0),
        routes: routes.length,
      },
      runtimeIntrospection: { available: true },
    });
  },
};
