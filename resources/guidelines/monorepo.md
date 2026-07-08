## NestJS Monorepo Workspace

This project is a **NestJS monorepo** (`nest-cli.json` with `"monorepo": true`): multiple
applications under `apps/*` and shared libraries under `libs/*`, each its own project.

- **Applications** (`type: "application"`) have their own `main.ts` + root module and are
  built/run independently (`nest build <app>`, `nest start <app>`).
- **Libraries** (`type: "library"`) export modules/providers consumed by apps via a path
  alias (e.g. `@app/shared`). They have no bootstrap of their own.

When working here:
- **Target the right project.** The `nest-boost` MCP tools `list_routes` and `module_graph`
  accept a `project` argument — pass the app you're changing (omitting it uses the default
  project). `application_info` lists every app and library and marks the default.
- **Scaffold into a project** with the `--project` flag:
  `nest generate service billing --project api`.
- **Shared code goes in a library**, not copied between apps. Create one with
  `nest generate library <name>`, then import its module where needed.
- Don't cross-import an application's internal providers from another app — extract shared
  code into a library instead.
- A library's modules appear in the DI graph of any app that imports it, so inspect a lib's
  wiring through an app that consumes it.
