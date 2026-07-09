# Agents & extending

## Supported agents

| Agent | MCP config | Guidelines | Skills |
| --- | --- | --- | --- |
| Claude Code | `.mcp.json` | `CLAUDE.md` | `.claude/skills/` |
| Cursor | `.cursor/mcp.json` | `.cursor/rules/nest-boost.mdc` | — |
| Codex | *(CLI: `codex mcp add …`)* | `AGENTS.md` | — |
| Gemini CLI | `.gemini/settings.json` | `AGENTS.md` | — |
| Generic | `.mcp.json` | `AGENTS.md` | — |

`install` prompts which to configure (defaulting to the ones already present in the project).

## Extending nest-boost

The codebase is organized so that each kind of extension is a localized change.

### Add an ecosystem package (guideline / skill gating)

Add an entry to `src/lib/ecosystem.ts`:

```ts
{ id: "drizzle", label: "Drizzle", match: ["drizzle-orm"], guideline: "drizzle.md", skill: "drizzle-development" }
```

`match` are the npm package names that trigger it. Add the referenced
`resources/guidelines/<file>` and/or `resources/skills/<skill>/SKILL.md`.

### Add an architecture style or auth strategy

Add an entry to `src/install/architectures.ts` or `src/install/auth.ts`, plus its guideline
(`resources/guidelines/architecture/*.md` or `.../auth/*.md`) and skill folder. It then appears
in the install prompt automatically.

### Add a test layout

Add an entry to `src/install/test-layout.ts` + its `resources/guidelines/test-layout/*.md`.

### Add an agent

Add an object to `AGENTS` in `src/install/agents/agent.ts`, declaring where its MCP config,
guidelines, and skills live. The writers handle the rest.

### Ship a skill from your own package

Bundle a skill in your library and declare it (see
[Guidelines & skills → package-bundled](./guidelines-and-skills.md#skills-bundled-by-a-package)):

```json
{ "nestBoost": { "skills": ["skill"] } }
```

### Ship an MCP server from your own package

A package can expose its **own MCP server** and have nest-boost register it into each configured
agent's MCP config (alongside nest-boost's server), so its tools sit next to the built-in ones.
Declare it in the package's `package.json`:

```json
{ "nestBoost": { "mcp": { "command": "npx", "args": ["-y", "@scope/pkg", "mcp"] } } }
```

A single object registers one server (keyed by `name`, else the package's short name); a map
`{ "<key>": { command, args } }` registers several. `nest-boost install` writes them, and
`nest-boost update` picks up servers from newly-added packages. This keeps each tool set in its
own process, versioned by its own package — nest-boost only wires the config.

Example: [NestKit](https://nestjs.mgvdev.io/nestkit) can ship `nestkit mcp` (a dependency-graph
tool over `nestkit graph --json`); declaring `nestBoost.mcp` makes it appear in the agent
automatically for NestKit workspaces.

### Add a custom skill to a single project

Drop a `SKILL.md` in `.nest-boost/skills/<name>/` and run `nest-boost update`. See the
[knowledge base](./guidelines-and-skills.md#the-knowledge-base--nest-bootskills).
