---
name: using-evaluate
description: Use the nest-boost `evaluate` MCP tool to run code inside the booted NestJS app (REPL/Tinker-style) — resolve providers, call service methods, and inspect real values. Use when you need to observe actual runtime behavior or data rather than reason about it statically.
---

# Using the `evaluate` tool

The `nest-boost` `evaluate` MCP tool runs a TypeScript/JavaScript snippet **inside the fully
booted application** and returns the serialized result — the NestJS equivalent of Laravel
Tinker. Reach for it when static reading isn't enough and you need to *observe* the running app.

## When to use
- Call a service method and see the real result (`await $(UsersService).findAll()`).
- Check a computed value, config, or feature-flag as the app actually resolves it.
- Reproduce or confirm a bug against live wiring.
- Explore what a provider exposes before writing code against it.

Prefer the read-only tools (`db_schema`, `db_query`, `module_graph`, `list_routes`) when they
answer the question — `evaluate` is heavier and unguarded (see Safety).

## How it works
- `get(Token)` / `$(Token)` resolve a provider from the DI container.
- **Every provider/controller class is in scope by name** — reference it directly:
  `$(BillingService)`, `new CreateUserDto()`, etc.
- `await` is supported. Pass a single expression, or statements ending in `return`.
- In a **monorepo**, pass `project` to choose which app to boot (defaults to the workspace default).

```jsonc
evaluate { "code": "await $(UsersService).findOne(1)" }
evaluate { "code": "const c = $(ConfigService); return c.get('FEATURE_X');" }
evaluate { "code": "$(CatsService).findAll().length", "project": "api" }
```

## Safety — read first
`evaluate` **boots the app for real** (lifecycle hooks + live DB/network connections) and runs
**arbitrary code with no read-only guard**. It *can mutate or delete data*.
- Default to **read** operations (`find*`, `get*`, computed getters). Avoid `save`/`delete`/
  `update`/external calls unless the user explicitly asked.
- Never run destructive code against a production database.
- Results are serialized with a depth/row cap — large objects are truncated.

## If it's disabled
The tool is **opt-in**. If it returns a "disabled" error, tell the user to enable it:
`npx nest-boost install --enable-evaluate`, or add `"evaluate": { "enabled": true }` to
`nest-boost.json`. Don't try to work around it.

## Ground yourself
Use `module_graph` first to learn which providers exist and their real dependencies, so you
know what to resolve with `$()` and what a method needs.
