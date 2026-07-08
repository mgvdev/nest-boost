<div align="center">

# nest-boost

**Laravel Boost, for NestJS.**

An MCP server, AI guidelines, and agent skills that teach your coding agent how *your*
NestJS application is actually wired — its real modules, routes, and dependency-injection
graph — and how to write idiomatic Nest code.

[![Bun](https://img.shields.io/badge/runtime-Bun-000000?logo=bun)](https://bun.sh)
[![NestJS](https://img.shields.io/badge/framework-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![MCP](https://img.shields.io/badge/protocol-MCP-4A154B)](https://modelcontextprotocol.io)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## Why

AI coding agents are great at NestJS in the abstract, but they don't know *your* app.
They guess module boundaries, invent routes that already exist, and follow whatever
architecture they saw last. nest-boost closes that gap: it gives the agent live,
grounded knowledge of your codebase over the [Model Context
Protocol](https://modelcontextprotocol.io), plus curated best-practice guidance tuned to
the packages and conventions you actually use.

It's the NestJS counterpart to [Laravel Boost](https://github.com/laravel/boost),
built on [Bun](https://bun.sh) as both runtime and package manager.

## What you get

| Piece | What it does |
| --- | --- |
| **MCP server** | Boots your app and exposes tools to inspect its modules, routes, and DI graph |
| **AI guidelines** | Best-practice conventions, composed from the packages you use, loaded up front |
| **Agent skills** | On-demand, task-specific playbooks (testing, architecture, auth, per-library) |
| **`skill-builder`** | A skill that writes *new* skills for libraries nest-boost doesn't cover yet |

One command wires all of it into your agent of choice.

## Requirements

- [Bun](https://bun.sh) `>= 1.1`
- A NestJS project (`>= 9`)

## Quick start

```bash
bun add -d nest-boost
npx nest-boost install
```

`install` inspects your project and asks a few questions:

- **Architecture style** — Standard layered · CQRS · Hexagonal
- **Auth strategy** — Passport · Better Auth · none *(defaulted from your dependencies)*
- **Test layout** — colocated · `__tests__/` · central `test/` (unit + feature)
- **Agents** — Claude Code · Cursor · Codex · Gemini CLI · generic

…then writes the MCP configuration, composes the guidelines, and installs the matching
skills. Your agent now understands the project.

Non-interactive (CI, scripts):

```bash
npx nest-boost install --agents claude --arch hexagonal --auth better-auth --yes
```

Keep everything fresh after dependency changes:

```bash
npx nest-boost update
```

## MCP server

`nest-boost mcp` starts a stdio MCP server. It boots your app in **preview mode**
(`NestFactory.create(AppModule, { preview: true, snapshot: true })`), which instantiates
the module/provider/controller graph **without** running lifecycle hooks
(`onModuleInit`, …) or opening database/network connections — safe to run against a real
application.

| Tool | Description |
| --- | --- |
| `application_info` | Bun/Node/Nest versions, detected packages, the workspace layout (apps + libraries), and module/controller/provider/route counts |
| `list_routes` | Every HTTP route: method, path, controller, handler, owning module, and attached guards / interceptors / pipes. Filter by method or path |
| `module_graph` | Every module with its controllers, providers (scope + whether exported), imported modules, and exported tokens |
| `nest_cli` | List and run whitelisted `nest` CLI commands (`generate`, `build`, `info`) |
| `db_schema` | Read the database schema — SQL tables/columns/keys, or MongoDB collections with sampled fields |
| `db_query` | Run a **read-only** query (SELECT/WITH/… for SQL, or a MongoDB `find`) and return rows |
| `evaluate` | REPL/Tinker-style: run a snippet in the booted app (`await $(UsersService).findAll()`). **Opt-in** — real boot, arbitrary code |

In a **monorepo**, `list_routes` and `module_graph` accept a `project` argument to target a
specific application (omitted → the workspace default project); `application_info` lists
every app and library.

Most editors that speak MCP pick up the generated config automatically. To register
manually:

```json
{
  "mcpServers": {
    "nest-boost": { "command": "npx", "args": ["-y", "nest-boost", "mcp"] }
  }
}
```

The generated config uses `npx` by default; pass `--runner bunx` at install to use `bunx`
instead (both honor the `#!/usr/bin/env bun` shebang). Either way, **Bun must be
installed** — the MCP server imports your app's TypeScript and boots Nest, which needs a
TS-capable runtime.

## Guidelines

Guidelines are Markdown loaded up front. nest-boost composes them from what your project
uses — core Nest conventions, a version note, your chosen architecture and auth strategy,
and one section per detected package (TypeORM, Prisma, GraphQL, Mongoose, config,
validation, Swagger, queues, testing…).

They're written into the agent's guideline file (`CLAUDE.md`, `AGENTS.md`, a Cursor rule,
…) between managed markers, so **your own content around them is preserved** and the
block is regenerated by `nest-boost update`.

## Skills

[Agent Skills](https://agentskills.io) are loaded on demand for a specific task, keeping
context lean. nest-boost installs:

- **Baseline** — `nestjs-development`, `nestjs-docs` (authoritative lookups against the
  [official NestJS docs](https://github.com/nestjs/docs.nestjs.com) on GitHub),
  `testing-jest`, `suites-testing` (fast isolated unit tests with
  [Suites](https://docs.nestjs.com/recipes/suites), when detected)
- **Package-gated** — ORMs/ODMs (`typeorm-development`, `prisma-development`, `sequelize-development`, `mikro-orm-development`, `mongoose-development`), plus `graphql-development`, `orpc-development`, … (only when detected)
- **Architecture** — `architecture-standard` / `-cqrs` / `-hexagonal`
- **Auth** — `auth-passport` / `auth-better-auth`
- **`skill-builder`** — see below

## Growing the knowledge base

nest-boost can't ship a skill for every library — so it ships one that **writes new skills
on demand**. Point the `skill-builder` skill at any dependency:

> "make a skill for drizzle-orm"

The agent researches the library — its `llms.txt`, official docs,
[Context7](https://context7.com), an existing community skill (`npx skills add …`), its
NestJS integration guide — writes `.nest-boost/skills/<name>/SKILL.md`, and runs
`nest-boost update` to propagate it to every configured agent.

`.nest-boost/skills/` is your **committed** knowledge base (the source of truth). The
copies under `.claude/skills/` etc. are regenerated by `update` and can be gitignored. A
local skill overrides a packaged one of the same name.

## Database tools

`db_schema` and `db_query` give the agent grounded knowledge of your **actual** database —
the schema after migrations, and real rows — independent of the ORM you use.

- **Connection** is resolved from `nest-boost.json` `database.url`, else `DATABASE_URL`, else a
  project `.env`. Set it once:
  ```json
  { "database": { "url": "postgres://user:pass@localhost:5432/app" } }
  ```
- **Engines**: PostgreSQL, MySQL/MariaDB, SQLite, MongoDB. The dialect is inferred from the URL
  scheme. Drivers (`pg`, `mysql2`, `mongodb`) are loaded from your project's `node_modules`
  (they're already there if your app uses them); SQLite uses Bun's built-in driver.
- **Read-only, enforced**: `db_query` rejects anything but a single read statement and runs it
  inside a read-only transaction (SQLite opens the file read-only; MongoDB issues a `find`).
  Results are capped. The agent can inspect data, never mutate it.

```jsonc
db_schema {}                                       // all tables/collections
db_query  { "sql": "SELECT id, email FROM users LIMIT 10" }
db_query  { "collection": "users", "filter": { "active": true } }   // MongoDB
```

## `evaluate` — REPL / Tinker for the agent

Like Laravel Tinker, `evaluate` runs a snippet **inside your booted app** and returns the
result. `get(Token)` / `$(Token)` resolve a provider, and every provider/controller class is
available by name:

```jsonc
evaluate { "code": "await $(UsersService).findAll()" }
evaluate { "code": "const s = $(BillingService); return s.total(42);" }
```

Built on `NestFactory.createApplicationContext` (DI + lifecycle, no HTTP), TypeScript is
transpiled, `await` is supported, and the result is serialized safely (depth-limited,
circular-safe).

**It is opt-in and unguarded by design.** Unlike the other tools it boots the app *for real*
(lifecycle hooks + live DB/network) and runs *arbitrary code* — it can mutate data. Enable it
deliberately:

```bash
npx nest-boost install --enable-evaluate
# or in nest-boost.json:
{ "evaluate": { "enabled": true } }
```

Disabled by default; the tool returns a clear error until you turn it on.

## Monorepo workspaces

nest-boost understands [NestJS monorepos](https://docs.nestjs.com/cli/monorepo) (`nest-cli.json`
with `"monorepo": true`). `install` reads every project from `nest-cli.json` — each
application and library — and records them in `nest-boost.json`. The MCP then introspects
**any application on demand**:

```jsonc
// application_info lists them; then target one:
list_routes  { "project": "api" }      // routes of the api app
module_graph { "project": "worker" }   // DI graph of the worker app
```

- **Applications** are booted individually; pass `project` or rely on the default (the
  workspace default project from `nest-cli.json`). Set it with `--default-project <name>`.
- **Libraries** are listed but not booted (a library has no bootstrap) — its modules still
  appear in the graph of any app that imports it.
- Architecture and auth are chosen once for the whole workspace.

A single-app project needs no configuration — it's treated as a workspace of one.

## Supported agents

| Agent | MCP | Guidelines | Skills |
| --- | :---: | :---: | :---: |
| Claude Code | `.mcp.json` | `CLAUDE.md` | `.claude/skills/` |
| Cursor | `.cursor/mcp.json` | `.cursor/rules/` | — |
| Codex | *(CLI)* | `AGENTS.md` | — |
| Gemini CLI | `.gemini/settings.json` | `AGENTS.md` | — |
| Generic | `.mcp.json` | `AGENTS.md` | — |

Adding another agent is a single object in `src/install/agents/agent.ts`.

## Configuration

`install` writes `nest-boost.json`:

```json
{
  "projects": [
    { "name": "api", "type": "application", "root": "apps/api", "entryModule": "apps/api/src/api.module.ts", "moduleExport": "ApiModule" },
    { "name": "shared", "type": "library", "root": "libs/shared" }
  ],
  "defaultProject": "api",
  "agents": ["claude"],
  "architecture": "hexagonal",
  "auth": "better-auth",
  "testLayout": "central",
  "database": { "url": "postgres://user:pass@localhost:5432/app" }
}
```

A single-app project has one `application` entry with `root: "."`. Legacy v0.1 configs
(`entryModule`/`moduleExport` at the top level) are auto-migrated on read.

## CLI reference

```
nest-boost install     Detect packages, configure agents, install guidelines + skills
nest-boost update      Re-sync guidelines + skills for the recorded agents
nest-boost mcp         Run the MCP server over stdio (used by agents)

install options:
  --agents <a,b>        Preselect agents (claude,cursor,codex,gemini,generic)
  --arch <style>        Architecture style (standard,cqrs,hexagonal)
  --auth <strategy>     Auth strategy (none,passport,better-auth)
  --test-layout <id>    Test layout (colocated,colocated-subfolder,central)
  --runner <bunx|npx>   MCP launcher for the generated config (default: npx)
  --default-project <n> Monorepo: the app the MCP boots by default
  --fetch-auth-skill    Fetch the official community skill for the auth strategy
  --entry <path>        Single-app: root module file (default: src/app.module.ts)
  --module <name>       Single-app: root module export (default: AppModule)
  --yes                 Accept defaults, skip prompts
```

## How it works

```
npx nest-boost install
        │
        ├─ detect()            read package.json → ecosystem packages + versions
        ├─ prompt              architecture · auth · agents  (or flags)
        ├─ compose guidelines  core + version + arch + auth + per-package
        ├─ resolve skills      baseline + gated + arch + auth + local (.nest-boost/skills)
        └─ per agent           write .mcp.json · guidelines · copy skills

npx nest-boost mcp   (run by the agent)
        │
        └─ NestFactory.create(AppModule, { preview: true, snapshot: true })
                 └─ ModulesContainer + reflection → application_info · list_routes · module_graph
```

## Development

```bash
bun install
bun test          # unit + real stdio MCP subprocess against a fixture app
bun run typecheck
```

The test suite boots a fixture NestJS app under `tests/fixtures/sample-app` and exercises
the tools end to end, including a real `nest-boost mcp` subprocess driven over stdio.

## Roadmap / out of scope for v1

- Database schema / query MCP tools (Nest is ORM-agnostic — deferred)
- A hosted documentation-search API (docs are handled by the `nestjs-docs` skill instead)
- More architecture styles and auth strategies (the registries are extensible)

Contributions welcome — the codebase is small, typed, and organized so that adding an
agent, an architecture, an auth strategy, or an ecosystem package is a localized change.

## Acknowledgements

Inspired by [Laravel Boost](https://github.com/laravel/boost). Built for the
[NestJS](https://nestjs.com) community.

## License

[MIT](./LICENSE)
