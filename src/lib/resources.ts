import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cached: string | null = null;

/**
 * Locate the packaged `resources/` directory (guidelines + skills). Walks up
 * from this module until it finds a directory containing `resources/guidelines`,
 * which works both in development (running from `src/`) and when published
 * (running from `dist/`, with `resources/` shipped at the package root).
 */
export function resourcesDir(): string {
  if (cached) return cached;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "resources");
    if (existsSync(join(candidate, "guidelines"))) {
      cached = candidate;
      return cached;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("nest-boost: could not locate the packaged resources/ directory.");
}

export function guidelinesDir(): string {
  return join(resourcesDir(), "guidelines");
}

export function skillsDir(): string {
  return join(resourcesDir(), "skills");
}
