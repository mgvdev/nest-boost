import { existsSync, readFileSync } from "node:fs";
import { join, normalize } from "node:path";

export interface EntryModule {
  entryModule: string;
  moduleExport: string;
}

/** Discovery for a single-app project rooted at `src` with entry `main`. */
export function findEntryModule(projectRoot: string): EntryModule {
  return findEntryModuleIn(projectRoot, { sourceRoot: "src", entryFile: "main" });
}

/**
 * Best-effort discovery of a project's root module, given its source root and
 * entry file (from nest-cli.json). Scans `<sourceRoot>/<entryFile>.ts` for the
 * class passed to `NestFactory.create(...)`, else falls back to conventional
 * module filenames under the source root. Paths returned are repo-relative.
 */
export function findEntryModuleIn(
  projectRoot: string,
  project: { sourceRoot: string; entryFile: string },
): EntryModule {
  const scanned = scanMain(projectRoot, project.sourceRoot, project.entryFile);
  if (scanned) return scanned;

  for (const rel of [
    join(project.sourceRoot, "app.module.ts"),
    join(project.sourceRoot, "app.module.js"),
  ]) {
    if (existsSync(join(projectRoot, rel))) {
      return { entryModule: rel, moduleExport: "AppModule" };
    }
  }

  // Fall back to the convention even if absent; install will warn.
  return { entryModule: join(project.sourceRoot, "app.module.ts"), moduleExport: "AppModule" };
}

function scanMain(projectRoot: string, sourceRoot: string, entryFile: string): EntryModule | null {
  const mainPath = join(projectRoot, sourceRoot, `${entryFile}.ts`);
  if (!existsSync(mainPath)) return null;
  try {
    const src = readFileSync(mainPath, "utf8");
    const created = src.match(
      /NestFactory\.create(?:Microservice|ApplicationContext)?\s*(?:<[^>]*>)?\s*\(\s*([A-Za-z0-9_]+)/,
    );
    const moduleName = created?.[1];
    if (!moduleName) return null;
    const imp = src.match(
      new RegExp(`import\\s*\\{[^}]*\\b${moduleName}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`),
    );
    const from = imp?.[1];
    if (!from || !from.startsWith(".")) return null; // alias/package import — can't resolve to a file
    const rel = normalize(join(sourceRoot, from));
    return { entryModule: rel.endsWith(".ts") ? rel : `${rel}.ts`, moduleExport: moduleName };
  } catch {
    return null;
  }
}
