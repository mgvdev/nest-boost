# Development

nest-boost is a Node.js CLI written in TypeScript, developed with [Bun](https://bun.sh).

## Setup

```bash
bun install
bun test          # unit + a real stdio MCP subprocess against fixtures
bun run typecheck # tsc --noEmit
bun run build     # bundle to dist/ (the published Node bin)
```

## Runtime model

- The published **bin is `dist/cli.js`** (`#!/usr/bin/env node`), bundled with
  `bun build --target=node --format=esm --packages=external`; dependencies stay external and
  resolve from `node_modules` at runtime. `dist/` is gitignored and built by `prepublishOnly`.
- The MCP server loads the host app's TypeScript through `tsx` under Node (native `import()`
  under Bun). `tsx` (esbuild) emits the decorator metadata NestJS DI needs, so the host
  `tsconfig.json` must have `emitDecoratorMetadata: true`.
- Tests run under Bun and exercise the Bun code paths (`bun:sqlite`, native TS import); the Node
  paths (`tsx`, `node:sqlite`) are validated separately.

## Layout

```
src/
  cli.ts                     arg dispatch → install | update | mcp
  commands/                  install.ts, update.ts, mcp.ts
  install/
    detect.ts                package.json → ecosystem packages + versions
    nest-cli.ts              parse nest-cli.json → workspace projects
    config.ts                nest-boost.json load/save (+ legacy migration)
    architectures.ts auth.ts test-layout.ts runner.ts    install-time registries
    third-party.ts           discover skills bundled by dependencies
    agents/agent.ts          supported-agent registry
    writers/                 mcp-config.ts, guidelines.ts, skills.ts
  mcp/
    server.ts                MCP server + tool registry
    boot.ts                  preview boot (introspection), cached per project
    introspect.ts            ModulesContainer walk → modules / routes
    tools/                   app-info, routes, graph, nest-cli, db-schema, db-query, evaluate
    db/                      connection resolver + per-dialect adapters + read-only guard
    evaluate/                real boot + sandbox + safe serializer
  lib/
    pkg.ts ecosystem.ts resources.ts load-module.ts
resources/
  guidelines/   guidelines/**.md (core, versions, architecture, auth, test-layout, per-package)
  skills/       <name>/SKILL.md
tests/          bun tests + fixtures/ (sample-app, monorepo-app, eval-app)
```

## Testing notes

- Fixtures are booted from *within the repo* so Nest resolves from the repo's `node_modules`
  (a `/tmp` copy would resolve from the global cache and fail).
- Adding an MCP tool means updating the tool-count assertion in `tests/mcp-stdio.test.ts`.

## Release

`prepublishOnly` runs `build → typecheck → test`. Publish with:

```bash
npm publish --access public   # scoped package, public access
```
