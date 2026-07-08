# The `evaluate` tool

`evaluate` runs a TypeScript/JavaScript snippet **inside your booted application** and returns
the serialized result — the NestJS equivalent of Laravel Tinker. Use it to observe real
runtime behavior and data instead of reasoning about it statically.

```jsonc
evaluate { "code": "await $(UsersService).findAll()" }
evaluate { "code": "const s = $(BillingService); return s.total(42);" }
evaluate { "code": "app.get(MathService).add(40, 2)", "project": "api" }
```

## In scope

- **`app`** — the `INestApplicationContext`: `app.get(Token)`, `app.resolve(Token)`,
  `app.select(Module)`.
- **`get(Token)` / `$(Token)`** — resolve a provider. Accepts a class, a **string** name
  (`$('UsersService')`), or the current instance, and falls back to the registered class by
  name — so a mismatched reference (e.g. from a manual `await import(...)`) still resolves.
- **Every provider/controller class by name** — reference it directly: `$(UsersService)`.

`await` is supported. Pass a single expression, or statements ending in `return`. On a failed
lookup the response includes `availableProviders` so the correct name is obvious.

> Don't `import` providers to get their class — a manually imported class is a *different
> reference* than the one Nest registered. The classes are already in scope; use `$(Service)`
> or `$('Service')`.

## How it works

- Boots the app with `NestFactory.createApplicationContext` (DI + lifecycle, no HTTP), cached
  per project — separate from the preview boot used by the read-only tools.
- Transpiles TypeScript with the standard `typescript` compiler; results are serialized safely
  (depth-limited, circular-safe).
- Arguments: `code` (required), `project` (monorepo, optional), `timeoutMs` (default 5000).

## Safety — read first

`evaluate` is **development-only and unguarded by design**. It boots the app *for real*
(lifecycle hooks + live DB/network connections) and runs *arbitrary code* — it can mutate data.

- **Enabled by default**, but **blocked when `NODE_ENV=production`**.
- Disable it with `npx @mgvdev/nest-boost install --disable-evaluate`, or
  `"evaluate": { "enabled": false }` in `nest-boost.json`.
- Prefer read operations; avoid `save`/`delete`/`update` unless explicitly asked. Never run
  destructive code against a production database.

The `using-evaluate` skill teaches the agent these rules.
