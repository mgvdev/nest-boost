import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { INestApplicationContext } from "@nestjs/common";
import { ModulesContainer, NestFactory } from "@nestjs/core";
import { DEFAULT_CONFIG, loadConfig } from "../install/config";

export interface BootSuccess {
  ok: true;
  app: INestApplicationContext;
  modules: ModulesContainer;
  entryModule: string;
}

export interface BootFailure {
  ok: false;
  error: string;
}

export type BootResult = BootSuccess | BootFailure;

let cached: BootResult | null = null;

/**
 * Boot the host NestJS application in preview mode for introspection.
 *
 * `preview: true` instantiates the module/provider/controller graph WITHOUT
 * running lifecycle hooks (onModuleInit, etc.) or opening real DB/network
 * connections, making it safe to run against a production app. `snapshot: true`
 * populates the internal graph. The booted context is cached for the lifetime
 * of the MCP server process.
 */
export async function bootApp(projectRoot: string = process.cwd()): Promise<BootResult> {
  if (cached) return cached;
  cached = await bootUncached(projectRoot);
  return cached;
}

/** Reset the cache — used by tests that boot multiple fixtures in one process. */
export function resetBootCache(): void {
  cached = null;
}

async function bootUncached(projectRoot: string): Promise<BootResult> {
  const config = loadConfig(projectRoot) ?? DEFAULT_CONFIG;
  const entryPath = isAbsolute(config.entryModule)
    ? config.entryModule
    : join(projectRoot, config.entryModule);

  if (!existsSync(entryPath)) {
    return {
      ok: false,
      error:
        `Could not find the root module at "${config.entryModule}". ` +
        `Run \`nest-boost install\` to configure the entry module, or check nest-boost.json.`,
    };
  }

  let moduleExports: Record<string, unknown>;
  try {
    moduleExports = (await import(pathToFileURL(entryPath).href)) as Record<string, unknown>;
  } catch (err) {
    return { ok: false, error: `Failed to import "${config.entryModule}": ${describe(err)}` };
  }

  const rootModule = moduleExports[config.moduleExport] ?? moduleExports.default;
  if (typeof rootModule !== "function") {
    return {
      ok: false,
      error: `Export "${config.moduleExport}" not found (or not a module class) in "${config.entryModule}".`,
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
    return { ok: true, app, modules, entryModule: config.entryModule };
  } catch (err) {
    return { ok: false, error: `The application failed to boot: ${describe(err)}` };
  }
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
