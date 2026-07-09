import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ProjectType = "application" | "library";

export interface ProjectMeta {
  name: string;
  type: ProjectType;
  root: string;
  sourceRoot: string;
  entryFile: string;
}

export type WorkspaceEngine = "nest-cli" | "nestkit";

export interface Workspace {
  /** True when the project is a monorepo workspace. */
  monorepo: boolean;
  /** Which engine declares the workspace (nest-cli.json or NestKit). */
  engine?: WorkspaceEngine;
  /** Name of the default project (the app the MCP boots when none is given). */
  defaultProject?: string;
  projects: ProjectMeta[];
}

/**
 * Parse `nest-cli.json` into a workspace description. In a monorepo it lists
 * every application and library; otherwise it reports monorepo=false with no
 * projects (callers fall back to single-app discovery).
 */
export function readWorkspace(projectRoot: string): Workspace {
  const path = join(projectRoot, "nest-cli.json");
  if (!existsSync(path)) return { monorepo: false, projects: [] };

  let cli: any;
  try {
    cli = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { monorepo: false, projects: [] };
  }

  const projectsMap = cli.projects as Record<string, any> | undefined;
  if (!projectsMap || typeof projectsMap !== "object") {
    return { monorepo: false, projects: [] };
  }

  const projects: ProjectMeta[] = Object.entries(projectsMap).map(([name, p]) => {
    const root = p.root ?? name;
    return {
      name,
      type: p.type === "library" ? "library" : "application",
      root,
      sourceRoot: p.sourceRoot ?? join(root, "src"),
      entryFile: p.entryFile ?? "main",
    };
  });

  // The default project is the one whose root matches the top-level root,
  // else the first application, else the first project.
  const topRoot = cli.root;
  const byRoot = projects.find((p) => p.root === topRoot);
  const firstApp = projects.find((p) => p.type === "application");
  const defaultProject = (byRoot ?? firstApp ?? projects[0])?.name;

  return {
    monorepo: cli.monorepo === true || projects.length > 1,
    engine: "nest-cli",
    defaultProject,
    projects,
  };
}
