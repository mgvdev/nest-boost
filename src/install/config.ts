import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const CONFIG_FILENAME = "nest-boost.json";

export interface NestBoostConfig {
  /**
   * Path (relative to project root) to the TS/JS file that exports the root
   * application module. Booted by the MCP server for runtime introspection.
   */
  entryModule: string;
  /** Named export of the root module in `entryModule`. Defaults to "AppModule". */
  moduleExport: string;
  /** Agent ids the user configured during install (claude, cursor, ...). */
  agents: string[];
  /** Chosen application architecture style (standard, cqrs, hexagonal). */
  architecture: string;
  /** Chosen auth strategy (none, passport, better-auth). */
  auth: string;
}

export const DEFAULT_CONFIG: NestBoostConfig = {
  entryModule: "src/app.module.ts",
  moduleExport: "AppModule",
  agents: [],
  architecture: "standard",
  auth: "none",
};

export function configPath(projectRoot: string): string {
  return join(projectRoot, CONFIG_FILENAME);
}

export function loadConfig(projectRoot: string): NestBoostConfig | null {
  const path = configPath(projectRoot);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<NestBoostConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return null;
  }
}

export function saveConfig(projectRoot: string, config: NestBoostConfig): void {
  writeFileSync(configPath(projectRoot), JSON.stringify(config, null, 2) + "\n");
}
