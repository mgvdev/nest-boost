import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { INestApplicationContext } from "@nestjs/common";
import { ModulesContainer, NestFactory } from "@nestjs/core";
import { DEFAULT_CONFIG, loadConfig, projectByName } from "../../install/config";
import { importModule } from "../../lib/load-module";

export interface ContextSuccess {
  ok: true;
  app: INestApplicationContext;
  modules: ModulesContainer;
  project: string;
}
export interface ContextFailure {
  ok: false;
  error: string;
}
export type ContextResult = ContextSuccess | ContextFailure;

/**
 * Fully-booted application contexts for the `evaluate` tool, cached per project.
 * Unlike the preview boot used by the read-only introspection tools, this runs
 * lifecycle hooks and opens real connections — it is the price of Tinker-style
 * evaluation and is why the tool is opt-in.
 */
const cache = new Map<string, ContextResult>();

export async function bootContext(
  projectRoot: string = process.cwd(),
  projectName?: string,
): Promise<ContextResult> {
  const config = loadConfig(projectRoot) ?? DEFAULT_CONFIG;
  const project = projectByName(config, projectName);
  if (!project) {
    const available = config.projects.map((p) => p.name).join(", ") || "(none)";
    return { ok: false, error: `Unknown project "${projectName}". Available: ${available}.` };
  }
  if (project.type === "library") {
    return { ok: false, error: `"${project.name}" is a library and cannot be booted standalone.` };
  }

  const hit = cache.get(project.name);
  if (hit) return hit;
  const result = await createContext(projectRoot, project.name, project.entryModule, project.moduleExport);
  cache.set(project.name, result);
  return result;
}

export function resetEvaluateCache(): void {
  cache.clear();
}

async function createContext(
  projectRoot: string,
  name: string,
  entryModule?: string,
  moduleExport = "AppModule",
): Promise<ContextResult> {
  if (!entryModule) return { ok: false, error: `Project "${name}" has no configured entry module.` };
  const entryPath = isAbsolute(entryModule) ? entryModule : join(projectRoot, entryModule);
  if (!existsSync(entryPath)) {
    return { ok: false, error: `Root module for "${name}" not found at "${entryModule}".` };
  }

  let exports: Record<string, unknown>;
  try {
    exports = await importModule(entryPath);
  } catch (err) {
    return { ok: false, error: `Failed to import "${entryModule}": ${describe(err)}` };
  }
  const rootModule = exports[moduleExport] ?? exports.default;
  if (typeof rootModule !== "function") {
    return { ok: false, error: `Export "${moduleExport}" not found in "${entryModule}".` };
  }

  try {
    // Real boot (no preview): DI + lifecycle, but no HTTP server.
    const app = await NestFactory.createApplicationContext(rootModule as any, {
      logger: false,
      abortOnError: false,
    });
    return { ok: true, app, modules: app.get(ModulesContainer), project: name };
  } catch (err) {
    return { ok: false, error: `The application "${name}" failed to boot: ${describe(err)}` };
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
