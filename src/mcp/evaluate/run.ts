import type { INestApplicationContext } from "@nestjs/common";
import type { ModulesContainer } from "@nestjs/core";
import { safeSerialize } from "./serialize";

const INTERNAL_MODULES = new Set(["InternalCoreModule"]);
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export interface EvaluateOutcome {
  result: unknown;
  globals: string[];
}

/**
 * Evaluate a snippet against a fully-booted app. Exposes `get`/`$` (resolve a
 * provider) and every user provider/controller class by name (like the NestJS
 * REPL), transpiles TypeScript, awaits the result, and serializes it safely.
 *
 * This runs ARBITRARY code in the real application — it is intentionally
 * unguarded (unlike db_query) and gated behind an opt-in config.
 */
export async function runEvaluate(
  app: INestApplicationContext,
  modules: ModulesContainer,
  code: string,
  timeoutMs = 5000,
): Promise<EvaluateOutcome> {
  const classes = collectClasses(modules);
  const names = [...classes.keys()];
  const values = [...classes.values()];

  const body = /\breturn\b/.test(code) ? code : `return (\n${code}\n);`;
  // Assign to a marker so Bun's transpiler doesn't tree-shake the (side-effect-free)
  // arrow expression away.
  const marker = "__nestBoostEvalFn";
  const source = `globalThis.${marker} = (async (get, $, ${names.join(", ")}) => {\n${body}\n});`;

  let js: string;
  try {
    js = new Bun.Transpiler({ loader: "ts" }).transformSync(source);
  } catch (err) {
    throw new Error(`Could not parse the code: ${err instanceof Error ? err.message : String(err)}`);
  }

  // eslint-disable-next-line no-eval
  (0, eval)(js);
  const fn = (globalThis as any)[marker] as (...args: unknown[]) => Promise<unknown>;
  delete (globalThis as any)[marker];
  const get = (token: unknown) => app.get(token as any, { strict: false });

  const result = await withTimeout(fn(get, get, ...values), timeoutMs);
  return { result: safeSerialize(result), globals: names };
}

/** Every user provider/controller class, keyed by its (valid-identifier) name. */
function collectClasses(modules: ModulesContainer): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const mod of modules.values()) {
    if (!mod.metatype || INTERNAL_MODULES.has(mod.metatype.name)) continue;
    for (const wrapper of [...mod.providers.values(), ...mod.controllers.values()]) {
      const cls = wrapper.metatype as (new (...a: any[]) => unknown) | undefined;
      if (typeof cls === "function" && cls.name && IDENT.test(cls.name) && !out.has(cls.name)) {
        out.set(cls.name, cls);
      }
    }
  }
  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Evaluation timed out after ${ms}ms.`)), ms),
    ),
  ]);
}
