# CLI reference

The package exposes a single binary, `nest-boost` (run via `npx @mgvdev/nest-boost …`).

```
nest-boost install     Detect packages, configure agents, install guidelines + skills
nest-boost update      Re-sync guidelines + skills for the recorded agents
nest-boost mcp         Run the MCP server over stdio (used by AI agents)
```

Global: `-h, --help` · `-v, --version`.

## `install`

Interactive by default; prompts for entry module / default project, architecture, auth, test
layout, and agents. Passing `--agents` or `--yes` makes it non-interactive (prompts are
replaced by defaults/flags).

| Flag | Description |
| --- | --- |
| `--agents <a,b>` | Preselect agents: `claude,cursor,codex,gemini,generic`. Implies non-interactive. |
| `--arch <style>` | Architecture: `standard`, `cqrs`, `hexagonal`. Default `standard`. |
| `--auth <strategy>` | Auth: `none`, `passport`, `better-auth`. Default inferred from dependencies. |
| `--test-layout <id>` | Test layout: `colocated`, `colocated-subfolder`, `central`. Default `colocated`. |
| `--runner <bunx\|npx>` | Launcher written into the MCP config. Default `npx`. |
| `--default-project <name>` | Monorepo: the app the MCP boots by default. |
| `--entry <path>` | Single-app: root module file. Default `src/app.module.ts`. |
| `--module <name>` | Single-app: root module export. Default `AppModule`. |
| `--fetch-auth-skill` | Fetch the official community skill for the auth strategy (e.g. Better Auth). |
| `--disable-evaluate` | Disable the `evaluate` REPL tool (enabled by default; development-only). |
| `--yes`, `-y` | Accept defaults, skip prompts. |

Examples:

```bash
# fully interactive
npx @mgvdev/nest-boost install

# CI / scripted
npx @mgvdev/nest-boost install --agents claude --arch hexagonal --auth better-auth --yes

# monorepo, choose the default app
npx @mgvdev/nest-boost install --agents claude --default-project api --yes
```

## `update`

Re-composes guidelines, re-copies skills, and registers MCP servers exposed by newly-installed
packages (`nestBoost.mcp`) for the agents already recorded in `nest-boost.json`. No prompts —
this is the "sync after adding a package" command. Intended for a `postinstall` / CI hook:

```json
{ "scripts": { "postinstall": "nest-boost update" } }
```

## `mcp`

Starts the stdio MCP server in the current working directory (which must be the NestJS
project). Not meant to be run by hand — agents launch it from the generated config. See
[MCP tools](./mcp-tools.md).
