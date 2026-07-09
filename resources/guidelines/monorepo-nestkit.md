## NestKit Workspace

This is a **[NestKit](https://nestjs.mgvdev.io/nestkit) monorepo** — a package-based NestJS
workspace engine (`@mgvdev/nestkit-*`), not the Nest CLI's `nest-cli.json` monorepo.

- **Apps** live in `apps/<name>/`, **libraries** in `packages/<name>/`; each package has its own
  `nestkit.json` (`type`, `entry`, `compiler`, …) and `package.json`.
- Local libraries are consumed as **real workspace dependencies**, wired with `nestkit add`.

When working here:
- **Target the right project.** The `nest-boost` MCP tools `list_routes` and `module_graph`
  accept a `project` argument; `application_info` lists every app and library.
- **Scaffold with the CLI:** `nestkit generate app <name>` / `nestkit generate lib <name>` —
  don't hand-create packages. Wire a library into an app with `nestkit add <lib> --to <app>`.
- **Share code via a `packages/` library**, never cross-import another app's internals.
- Build/run with `nestkit build`/`nestkit dev` (`--all` or per project); inspect the graph with
  `nestkit graph`.

See the `nestkit-development` skill for the full command and configuration reference.
