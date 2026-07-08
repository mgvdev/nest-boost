import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectType } from "./nest-cli";

export const CONFIG_FILENAME = "nest-boost.json";

export interface ProjectConfig {
  name: string;
  type: ProjectType;
  /** Repo-relative project root (".", "apps/api", …). */
  root: string;
  /** Repo-relative path to the file exporting the root module. Applications only. */
  entryModule?: string;
  /** Named export of the root module. Defaults to "AppModule". Applications only. */
  moduleExport?: string;
}

export interface NestBoostConfig {
  /** Every workspace project (a single app is one entry). */
  projects: ProjectConfig[];
  /** Name of the project the MCP boots when no `project` is specified. */
  defaultProject: string;
  /** Agent ids the user configured during install (claude, cursor, ...). */
  agents: string[];
  /** Chosen application architecture style (standard, cqrs, hexagonal). */
  architecture: string;
  /** Chosen auth strategy (none, passport, better-auth). */
  auth: string;
}

export const DEFAULT_CONFIG: NestBoostConfig = {
  projects: [
    { name: "app", type: "application", root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" },
  ],
  defaultProject: "app",
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
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<string, any>;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function saveConfig(projectRoot: string, config: NestBoostConfig): void {
  writeFileSync(configPath(projectRoot), JSON.stringify(config, null, 2) + "\n");
}

/** Look up a project by name, falling back to the default project. */
export function projectByName(config: NestBoostConfig, name?: string): ProjectConfig | undefined {
  const target = name ?? config.defaultProject;
  return config.projects.find((p) => p.name === target);
}

/**
 * Accept both the current schema and the legacy v0.1 shape
 * (`{ entryModule, moduleExport }` with no `projects`), synthesizing a single
 * application project so older installs keep working until they re-run install.
 */
function migrate(parsed: Record<string, any>): NestBoostConfig {
  const base = {
    agents: parsed.agents ?? [],
    architecture: parsed.architecture ?? "standard",
    auth: parsed.auth ?? "none",
  };

  if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
    return {
      ...base,
      projects: parsed.projects as ProjectConfig[],
      defaultProject: parsed.defaultProject ?? parsed.projects[0].name,
    };
  }

  // Legacy single-app config.
  const entryModule = parsed.entryModule ?? "src/app.module.ts";
  const moduleExport = parsed.moduleExport ?? "AppModule";
  return {
    ...base,
    projects: [{ name: "app", type: "application", root: ".", entryModule, moduleExport }],
    defaultProject: "app",
  };
}
