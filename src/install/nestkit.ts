import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { allDependencies, readPackageJson } from "../lib/pkg";
import type { ProjectMeta, Workspace } from "./nest-cli";

/**
 * Detect and enumerate a [NestKit](https://nestjs.mgvdev.io/nestkit) workspace.
 *
 * NestKit is a package-based NestJS workspace engine: each package (app or lib)
 * carries its own `nestkit.json` descriptor, apps live in `apps/` and libraries
 * in `packages/`. We discover packages from the root `package.json` `workspaces`
 * globs (falling back to `apps/*` + `packages/*`) and read each `nestkit.json`.
 */
export function readNestkitWorkspace(projectRoot: string): Workspace {
  const rootPkg = readPackageJson(projectRoot);
  const deps = rootPkg ? allDependencies(rootPkg) : {};
  const usesNestkit = Object.keys(deps).some((d) => d.startsWith("@mgvdev/nestkit"));

  const projects: ProjectMeta[] = [];
  for (const pkgDir of packageDirs(projectRoot, rootPkg)) {
    const nkPath = join(pkgDir, "nestkit.json");
    if (!existsSync(nkPath)) continue;

    let nk: any;
    try {
      nk = JSON.parse(readFileSync(nkPath, "utf8"));
    } catch {
      continue;
    }
    if (nk.type === "app-frontend") continue; // Vite frontend, not a Nest app

    const name = readPackageJson(pkgDir)?.name ?? basename(pkgDir);
    const root = relative(projectRoot, pkgDir) || ".";
    const sourceDir = typeof nk.sourceDir === "string" ? nk.sourceDir : "src";
    const entry = typeof nk.entry === "string" ? nk.entry : "src/main.ts";

    projects.push({
      name,
      type: nk.type === "lib" ? "library" : "application",
      root,
      sourceRoot: join(root, sourceDir),
      entryFile: basename(entry).replace(/\.[cm]?tsx?$/, ""),
    });
  }

  if (!usesNestkit && projects.length === 0) {
    return { monorepo: false, projects: [] };
  }

  const defaultProject = (projects.find((p) => p.type === "application") ?? projects[0])?.name;
  return {
    monorepo: projects.length > 0,
    engine: "nestkit",
    defaultProject,
    projects,
  };
}

/** Candidate package directories from `workspaces` globs, else the NestKit defaults. */
function packageDirs(projectRoot: string, rootPkg: ReturnType<typeof readPackageJson>): string[] {
  const raw = (rootPkg as any)?.workspaces;
  const patterns: string[] = Array.isArray(raw) ? raw : Array.isArray(raw?.packages) ? raw.packages : [];
  const globs = patterns.length ? patterns : ["apps/*", "packages/*"];

  const dirs: string[] = [];
  for (const glob of globs) {
    if (glob.endsWith("/*")) {
      const parent = join(projectRoot, glob.slice(0, -2));
      for (const entry of safeReaddir(parent)) dirs.push(join(parent, entry));
    } else {
      const dir = join(projectRoot, glob);
      if (existsSync(dir)) dirs.push(dir);
    }
  }
  return dirs;
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}
