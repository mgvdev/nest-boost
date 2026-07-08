import { ECOSYSTEM, type EcosystemEntry } from "../lib/ecosystem";
import {
  allDependencies,
  majorOf,
  readPackageJson,
  resolveInstalledVersion,
  type PackageJson,
} from "../lib/pkg";
import { readWorkspace, type ProjectMeta } from "./nest-cli";

export interface DetectedPackage {
  name: string;
  version?: string;
}

export interface Detection {
  /** Absolute project root that was inspected. */
  projectRoot: string;
  /** The project's own name/version from package.json. */
  project: { name?: string; version?: string };
  /** Runtime versions available at detection time. */
  runtime: { bun?: string; node?: string };
  /** Installed @nestjs/core version + major, if present. */
  nest?: { version?: string; major?: number };
  /** All ecosystem-relevant packages found, with resolved versions. */
  packages: DetectedPackage[];
  /** Ecosystem entries whose match hit this project. */
  entries: EcosystemEntry[];
  /** True when nest-cli.json declares a monorepo workspace. */
  monorepo: boolean;
  /** Workspace projects (empty for a single-app project). */
  projects: ProjectMeta[];
  /** Default workspace project name, if any. */
  defaultProject?: string;
}

/**
 * Inspect a project directory and report which NestJS ecosystem packages are in
 * use, at which versions, and which ecosystem entries (guidelines/skills) apply.
 */
export function detect(projectRoot: string): Detection {
  const pkg: PackageJson = readPackageJson(projectRoot) ?? {};
  const deps = allDependencies(pkg);

  const packages: DetectedPackage[] = [];
  const entries: EcosystemEntry[] = [];
  const seenPackages = new Set<string>();

  for (const entry of ECOSYSTEM) {
    const hit = entry.match.find((name) => name in deps);
    if (!hit) continue;
    entries.push(entry);
    for (const name of entry.match) {
      if (name in deps && !seenPackages.has(name)) {
        seenPackages.add(name);
        packages.push({ name, version: resolveInstalledVersion(projectRoot, name, deps[name]) });
      }
    }
  }

  const nestVersion = resolveInstalledVersion(projectRoot, "@nestjs/core", deps["@nestjs/core"]);
  const workspace = readWorkspace(projectRoot);

  return {
    projectRoot,
    project: { name: pkg.name, version: pkg.version },
    runtime: {
      bun: typeof Bun !== "undefined" ? Bun.version : undefined,
      node: process.versions?.node,
    },
    nest: nestVersion ? { version: nestVersion, major: majorOf(nestVersion) } : undefined,
    packages,
    entries,
    monorepo: workspace.monorepo,
    projects: workspace.projects,
    defaultProject: workspace.defaultProject,
  };
}

/** Whether the project looks like a NestJS app at all. */
export function isNestProject(detection: Detection): boolean {
  return detection.entries.some((e) => e.id === "nestjs");
}
