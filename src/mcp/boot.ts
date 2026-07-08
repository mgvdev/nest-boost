import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { INestApplicationContext } from "@nestjs/common";
import { ModulesContainer, NestFactory } from "@nestjs/core";
import { DEFAULT_CONFIG, loadConfig, projectByName, type ProjectConfig } from "../install/config";

export interface BootSuccess {
  ok: true;
  app: INestApplicationContext;
  modules: ModulesContainer;
  project: string;
  entryModule: string;
}

export interface BootFailure {
  ok: false;
  error: string;
}

export type BootResult = BootSuccess | BootFailure;

/** Booted apps are cached per project name for the MCP server's lifetime. */
const cache = new Map<string, BootResult>();

/**
 * Boot a NestJS application in preview mode for introspection.
 *
 * `preview: true` instantiates the module/provider/controller graph WITHOUT
 * running lifecycle hooks (onModuleInit, etc.) or opening real DB/network
 * connections, making it safe to run against a production app. `snapshot: true`
 * populates the internal graph.
 *
 * In a monorepo, `projectName` selects which application to boot; when omitted
 * the workspace default project is used. Results are cached per project.
 */
export async function bootApp(
  projectRoot: string = process.cwd(),
  projectName?: string,
): Promise<BootResult> {
  const config = loadConfig(projectRoot) ?? DEFAULT_CONFIG;
  const project = projectByName(config, projectName);

  if (!project) {
    const available = config.projects.map((p) => p.name).join(", ") || "(none)";
    return {
      ok: false,
      error: `Unknown project "${projectName}". Available projects: ${available}.`,
    };
  }

  const key = project.name;
  const hit = cache.get(key);
  if (hit) return hit;

  const result = await bootProject(projectRoot, project);
  cache.set(key, result);
  return result;
}

/** Reset the cache — used by tests that boot multiple fixtures in one process. */
export function resetBootCache(): void {
  cache.clear();
}

async function bootProject(projectRoot: string, project: ProjectConfig): Promise<BootResult> {
  if (project.type === "library") {
    return {
      ok: false,
      error:
        `"${project.name}" is a library and cannot be booted standalone. ` +
        `Introspect an application project instead; a library's modules appear in the graph of any app that imports it.`,
    };
  }

  const entryModule = project.entryModule;
  if (!entryModule) {
    return { ok: false, error: `Project "${project.name}" has no configured entry module.` };
  }

  const entryPath = isAbsolute(entryModule) ? entryModule : join(projectRoot, entryModule);
  if (!existsSync(entryPath)) {
    return {
      ok: false,
      error:
        `Could not find the root module for "${project.name}" at "${entryModule}". ` +
        `Run \`nest-boost install\`, or check nest-boost.json.`,
    };
  }

  let moduleExports: Record<string, unknown>;
  try {
    moduleExports = (await import(pathToFileURL(entryPath).href)) as Record<string, unknown>;
  } catch (err) {
    return { ok: false, error: `Failed to import "${entryModule}": ${describe(err)}` };
  }

  const exportName = project.moduleExport ?? "AppModule";
  const rootModule = moduleExports[exportName] ?? moduleExports.default;
  if (typeof rootModule !== "function") {
    return {
      ok: false,
      error: `Export "${exportName}" not found (or not a module class) in "${entryModule}".`,
    };
  }

  try {
    const app = await NestFactory.create(rootModule as any, {
      preview: true,
      snapshot: true,
      logger: false,
      abortOnError: false,
    });
    const modules = app.get(ModulesContainer);
    return { ok: true, app, modules, project: project.name, entryModule };
  } catch (err) {
    return { ok: false, error: `The application "${project.name}" failed to boot: ${describe(err)}` };
  }
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
