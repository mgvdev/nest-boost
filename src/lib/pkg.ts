import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/** Read and parse a package.json from a project directory. Returns null if absent/invalid. */
export function readPackageJson(projectRoot: string): PackageJson | null {
  const path = join(projectRoot, "package.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PackageJson;
  } catch {
    return null;
  }
}

/** All declared dependencies (prod + dev + peer) merged into a single name→range map. */
export function allDependencies(pkg: PackageJson): Record<string, string> {
  return {
    ...pkg.peerDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
}

/**
 * Resolve the actually-installed version of a dependency by reading its
 * package.json from node_modules. Falls back to the declared range (with any
 * leading ^ or ~ stripped) when the package is not installed.
 */
export function resolveInstalledVersion(
  projectRoot: string,
  name: string,
  declaredRange?: string,
): string | undefined {
  const installed = join(projectRoot, "node_modules", ...name.split("/"), "package.json");
  if (existsSync(installed)) {
    try {
      const parsed = JSON.parse(readFileSync(installed, "utf8")) as PackageJson;
      if (parsed.version) return parsed.version;
    } catch {
      /* ignore, fall through to declared range */
    }
  }
  return declaredRange?.replace(/^[\^~>=<\s]+/, "") || undefined;
}

/** Extract the leading `major` number from a version string, e.g. "11.1.27" → 11. */
export function majorOf(version: string | undefined): number | undefined {
  if (!version) return undefined;
  const match = version.match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
}
