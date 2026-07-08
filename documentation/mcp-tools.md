# MCP tools

`nest-boost mcp` runs a stdio [MCP](https://modelcontextprotocol.io) server exposing seven
tools. The four introspection tools boot your app in **preview mode**
(`NestFactory.create(AppModule, { preview: true, snapshot: true })`), which builds the
module/provider/controller graph **without** running lifecycle hooks or opening real
connections — safe against a production app. (`evaluate` is the exception; see below.)

| Tool | Purpose |
| --- | --- |
| `application_info` | Runtime + Nest versions, detected packages, workspace layout, and counts |
| `list_routes` | Every HTTP route with its enhancers |
| `module_graph` | Modules with controllers, providers, imports, exports |
| `nest_cli` | List / run whitelisted `nest` CLI commands |
| `db_schema` | Read the database schema — [details](./database-tools.md) |
| `db_query` | Read-only query — [details](./database-tools.md) |
| `evaluate` | REPL / Tinker — [details](./evaluate.md) |

## `application_info`

No required arguments. Returns project name/version, Node/Nest versions, detected ecosystem
packages with versions, the workspace (`monorepo`, `projects`, `defaultProject`), and counts of
modules/controllers/providers/routes for one application.

- `project` *(optional)* — in a monorepo, which application to count. Defaults to the workspace
  default project.

## `list_routes`

Lists routes: `method`, `path`, `controller`, `handler`, owning `module`, plus any `guards` /
`interceptors` / `pipes` (omitted when empty).

- `method` *(optional)* — filter by HTTP method (case-insensitive)
- `path` *(optional)* — filter by path substring
- `project` *(optional)* — monorepo application (default: workspace default)
- `format` *(optional)* — `"text"` for a dense one-line-per-route listing (fewer tokens)

## `module_graph`

The DI graph: each module with its `controllers`, `providers` (with non-default scope noted),
imported modules, and exported tokens. Framework-internal providers (`ModuleRef`, `Reflector`,
…) are filtered out.

- `module` *(optional)* — focus on one module by class name
- `project` *(optional)* — monorepo application
- `format` *(optional)* — `"text"` for a compact per-module outline

## `nest_cli`

- `action: "list"` — show the available `nest` commands (`nest --help`)
- `action: "run"` — run a **whitelisted** subcommand: `generate` / `g`, `build`, `info`.
  `command` = the subcommand, `args` = extra arguments. Arbitrary shell is not permitted.

Runs the project-local `nest` binary, else `npx -y @nestjs/cli`.

## Token economy

All tools return **compact JSON** (no indentation), omit empty/false fields, and drop
framework-internal providers. `list_routes` and `module_graph` also accept `format: "text"` for
a dense listing — roughly a 60–70 % token reduction versus pretty-printed JSON.

## Manual registration

Most editors pick up the generated config. To register by hand:

```json
{
  "mcpServers": {
    "nest-boost": { "command": "npx", "args": ["-y", "@mgvdev/nest-boost", "mcp"] }
  }
}
```
