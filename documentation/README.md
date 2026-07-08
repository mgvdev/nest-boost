# nest-boost documentation

**Laravel Boost, for NestJS.** An MCP server, AI guidelines, and agent skills that teach a
coding agent how *your* NestJS application is actually wired, and how to write idiomatic Nest
code.

## Contents

- [Getting started](./getting-started.md) — requirements, install, the first run
- [CLI reference](./cli.md) — `install` / `update` / `mcp` and every flag
- [Configuration](./configuration.md) — the `nest-boost.json` file
- [Install options](./install-options.md) — architecture, auth, test layout, runner, evaluate
- [MCP tools](./mcp-tools.md) — the tools the agent calls
- [Database tools](./database-tools.md) — `db_schema` / `db_query`
- [The `evaluate` tool](./evaluate.md) — REPL / Tinker for the agent
- [Guidelines & skills](./guidelines-and-skills.md) — the knowledge nest-boost installs
- [Agents & extending](./agents-and-extending.md) — supported agents and how to extend
- [Development](./development.md) — build, tests, internals

## How it fits together

```
nest-boost install
   │  detect ecosystem (package.json + nest-cli.json)
   │  ask: architecture · auth · test layout · agents
   ├─ write MCP config      → .mcp.json / .cursor/mcp.json / .gemini/settings.json
   ├─ compose guidelines    → CLAUDE.md / AGENTS.md / .cursor/rules
   └─ install skills        → .claude/skills/…  (packaged + package-bundled + local)

nest-boost mcp   (run by the agent, over stdio)
   └─ boots your app → application_info · list_routes · module_graph · nest_cli
                       db_schema · db_query · evaluate
```

Requires **Node.js ≥ 18.18** and a NestJS project (≥ 9). See
[Getting started](./getting-started.md).
