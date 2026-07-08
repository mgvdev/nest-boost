import type { INestApplicationContext } from "@nestjs/common";
import type { ModulesContainer } from "@nestjs/core";
import { safeSerialize } from "./serialize";

const INTERNAL_MODULES = new Set(["InternalCoreModule"]);
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// Identifiers that pass IDENT but are illegal as function parameter names — a
// provider so named must not be injected as a global (it would throw at build).
const RESERVED = new Set([
  "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default",
  "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function",
  "if", "import", "in", "instanceof", "new", "null", "return", "super", "switch", "this",
  "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield", "let", "static",
  "implements", "interface", "package", "private", "protected", "public", "arguments", "eval",
  "get", "$",
]);

export interface EvaluateOutcome {
  result: unknown;
  providers: string[];
}

interface Registry {
  /** name → provider/controller class (constructor). */
  classes: Map<string, unknown>;
  /** name → already-instantiated provider (from the container). */
  instances: Map<string, unknown>;
}

/**
 * Evaluate a snippet against a fully-booted app. Exposes `get`/`$` (resolve a
 * provider by class, by string name, or the current instance) and every user
 * provider/controller class by name (like the NestJS REPL). Transpiles
 * TypeScript, awaits the result, and serializes it safely.
 *
 * This runs ARBITRARY code in the real application — intentionally unguarded
 * (unlike db_query), development-only, and gated behind config.
 */
export async function runEvaluate(
  app: INestApplicationContext,
  modules: ModulesContainer,
  code: string,
  timeoutMs = 5000,
): Promise<EvaluateOutcome> {
  const registry = collect(modules);
  // Inject only globals whose name is a legal, non-reserved identifier so the
  // function is always constructible even in large, oddly-named apps.
  const names = [...registry.classes.keys()].filter((n) => !RESERVED.has(n));
  const values = names.map((n) => registry.classes.get(n));

  const body = /\breturn\b/.test(code) ? code : `return (\n${code}\n);`;
  // Assign to a marker so the transpiler/eval keeps the (side-effect-free) arrow.
  const marker = "__nestBoostEvalFn";
  const source = `globalThis.${marker} = (async (get, $, ${names.join(", ")}) => {\n${body}\n});`;

  const js = await transpile(source);

  // eslint-disable-next-line no-eval
  (0, eval)(js);
  const fn = (globalThis as any)[marker] as (...args: unknown[]) => Promise<unknown>;
  delete (globalThis as any)[marker];

  const resolve = makeResolve(app, registry);
  const result = await withTimeout(fn(resolve, resolve, ...values), timeoutMs);
  return { result: safeSerialize(result), providers: [...registry.classes.keys()] };
}

/**
 * Resolve a provider tolerantly, in order of robustness:
 * 1. the container's actual instance for that name (works for custom `provide`
 *    tokens and value/factory providers, and sidesteps DI identity mismatches
 *    when a *different* class reference is passed — e.g. from `await import`);
 * 2. `app.get` on the registered class for that name;
 * 3. `app.get` on the token as given.
 */
function makeResolve(app: INestApplicationContext, registry: Registry) {
  return (token: unknown): unknown => {
    const name =
      typeof token === "string" ? token : typeof token === "function" ? (token as Function).name : undefined;

    if (name) {
      if (registry.instances.has(name)) return registry.instances.get(name);
      const cls = registry.classes.get(name);
      if (cls) return app.get(cls as any, { strict: false });
    }
    return app.get(token as any, { strict: false });
  };
}

/** Names of every resolvable provider/controller (for `$('Name')` / debugging). */
export function listProviders(modules: ModulesContainer): string[] {
  return [...collect(modules).classes.keys()];
}

/** Index every user provider/controller by name → class and → live instance. */
function collect(modules: ModulesContainer): Registry {
  const classes = new Map<string, unknown>();
  const instances = new Map<string, unknown>();

  for (const mod of modules.values()) {
    if (!mod.metatype || INTERNAL_MODULES.has(mod.metatype.name)) continue;
    for (const wrapper of [...mod.providers.values(), ...mod.controllers.values()]) {
      const cls = wrapper.metatype as (new (...a: any[]) => unknown) | undefined;
      const name = (typeof cls === "function" && cls.name) || wrapper.name;
      if (typeof name !== "string" || !IDENT.test(name)) continue;

      if (typeof cls === "function" && cls.name && !classes.has(cls.name)) {
        classes.set(cls.name, cls);
      }
      // Prefer the concrete instance the container already built.
      if (wrapper.instance !== undefined && wrapper.instance !== null && !instances.has(name)) {
        instances.set(name, wrapper.instance);
      }
    }
  }
  return { classes, instances };
}

/**
 * Transpile TypeScript to JavaScript using the standard `typescript` compiler
 * (Node-friendly, no Bun-specific API), resolved from the host project. If it's
 * not installed, fall back to running the source as-is — plain-JS snippets
 * (the common case for REPL one-liners) need no transpile.
 */
async function transpile(source: string): Promise<string> {
  try {
    const spec = "typescript"; // indirection: optional, resolved from the host project
    const ts: any = await import(spec);
    return ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
  } catch {
    return source;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Evaluation timed out after ${ms}ms.`)), ms),
    ),
  ]);
}
