import { pathToFileURL } from "node:url";

/**
 * Import the host application's entry module, which is usually TypeScript.
 *
 * - Under Bun, `import()` loads `.ts` natively (with decorator metadata from the
 *   host tsconfig).
 * - Under Node, we route through `tsx` (esbuild), which transpiles the TS —
 *   including `emitDecoratorMetadata`, required for NestJS DI — on the fly.
 */
export async function importModule(entryPath: string): Promise<Record<string, unknown>> {
  const url = pathToFileURL(entryPath).href;

  if (typeof Bun !== "undefined") {
    return (await import(url)) as Record<string, unknown>;
  }

  const { tsImport } = await import("tsx/esm/api");
  return (await tsImport(entryPath, import.meta.url)) as Record<string, unknown>;
}
