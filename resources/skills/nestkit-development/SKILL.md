---
name: nestkit-development
description: Work in a NestKit workspace — a package-based NestJS monorepo engine (@mgvdev/nestkit). Scaffold apps/libs, wire local libraries, and build/dev with the NestKit CLI. Use when the project has nestkit.json files or @mgvdev/nestkit-* dependencies.
---

# NestKit workspaces

[NestKit](https://nestjs.mgvdev.io/nestkit) is a package-based NestJS **workspace engine** that
replaces the Nest CLI's Webpack monorepo with a real project graph (SWC for transforms, tsc for
types, Vite for frontends).

## When to use this skill
Use when the workspace contains `nestkit.json` files or `@mgvdev/nestkit-*` dependencies.

## Get the authoritative source
NestKit evolves — prefer docs over memory:
- Docs: https://nestjs.mgvdev.io/nestkit — Getting Started, Concepts, Commands, Configuration.
- Docs index (LLM-friendly): https://nestjs.mgvdev.io/llms.txt.

## Layout
- **Apps** live in `apps/<name>/`, **libraries** in `packages/<name>/`, frontends via Vite.
- Each package has its own **`nestkit.json`** descriptor and its own `package.json`; local
  libraries are consumed as **real workspace dependencies** (not TS path hacks).
- `nestkit.json` fields: `type` (`app` | `lib` | `app-frontend`), `entry` (default `src/main.ts`),
  `compiler` (`swc` | `tsc`), `sourceDir`, `outDir`, `assets`, `tsconfig`.

## CLI (`nestkit`)
- `nestkit init` — generate `nestkit.json` for each detected package.
- `nestkit generate <app|lib|frontend> <name>` (alias `g`/`new`) — scaffold into `apps/` or `packages/`.
- `nestkit add <lib> --to <app>` — add a local library as a dependency of an app (updates
  package.json, installs, syncs TS path aliases). **Use this to wire libraries — don't hand-edit imports/tsconfig.**
- `nestkit build <project> | --all` — build in dependency order (libs emit `.d.ts`, apps via SWC).
- `nestkit dev <projects…> | --all` — watch mode with prefixed, color-coded output.
- `nestkit graph [--json]` — the project dependency graph and build levels.
- `nestkit typecheck` / `sync` / `clean`.
- `nestkit migrate-from-nest-cli` — convert an existing `nest-cli.json` workspace.

## Rules
- New app/lib → `nestkit generate`, never hand-create the folder + config.
- Share code through a **library in `packages/`** consumed via `nestkit add`, not cross-app imports.
- Keep each package's `nestkit.json` accurate (`type`, `entry`) — the graph and builds depend on it.
- A package without `nestkit.json` is visible to the graph but **not compiled** by NestKit.

## Ground yourself
The `nest-boost` MCP tools understand this workspace: `application_info` lists every NestKit
project, and `list_routes` / `module_graph` accept a `project` argument to target one app.
