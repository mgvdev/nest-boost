import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface EntryModule {
  entryModule: string;
  moduleExport: string;
}

const CANDIDATES = ["src/app.module.ts", "app.module.ts", "src/app.module.js"];

/**
 * Best-effort discovery of the root application module. Prefers a conventional
 * `src/app.module.ts`; otherwise scans `src/main.ts` for the class passed to
 * `NestFactory.create(...)`.
 */
export function findEntryModule(projectRoot: string): EntryModule {
  for (const rel of CANDIDATES) {
    if (existsSync(join(projectRoot, rel))) {
      return { entryModule: rel, moduleExport: "AppModule" };
    }
  }

  const guess = scanMain(projectRoot);
  if (guess) return guess;

  // Fall back to the convention even if absent; install will warn.
  return { entryModule: "src/app.module.ts", moduleExport: "AppModule" };
}

function scanMain(projectRoot: string): EntryModule | null {
  const mainPath = join(projectRoot, "src", "main.ts");
  if (!existsSync(mainPath)) return null;
  try {
    const src = readFileSync(mainPath, "utf8");
    const created = src.match(/NestFactory\.create(?:Microservice|ApplicationContext)?\s*<[^>]*>?\s*\(\s*([A-Za-z0-9_]+)/);
    const moduleName = created?.[1];
    if (!moduleName) return null;
    const imp = src.match(
      new RegExp(`import\\s*\\{[^}]*\\b${moduleName}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`),
    );
    const from = imp?.[1];
    if (!from) return null;
    const rel = from.replace(/^\.\//, "src/").replace(/^\.\.\//, "");
    return { entryModule: rel.endsWith(".ts") ? rel : `${rel}.ts`, moduleExport: moduleName };
  } catch {
    return null;
  }
}
