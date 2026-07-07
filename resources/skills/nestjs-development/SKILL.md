---
name: nestjs-development
description: Build NestJS features the idiomatic way — modules, controllers, providers, DTOs, guards/interceptors/pipes, and DI wiring. Use when creating or modifying NestJS application code.
---

# NestJS Development

## When to use this skill
Use when adding a feature, endpoint, provider, or module to a NestJS app, or when
wiring dependency injection.

## Ground yourself first
Before writing code, call the `nest-boost` MCP tools:
- `application_info` — Nest version + installed packages.
- `module_graph` — where things live, what each module exports.
- `list_routes` — existing routes (avoid path collisions).

## Add a feature (recommended flow)
1. Scaffold with the CLI (via `nest_cli` tool or terminal):
   `nest generate module cats`, `nest generate controller cats`, `nest generate service cats`.
2. Put domain logic in the **service**; keep the **controller** thin.
3. Model inputs as **DTO** classes with `class-validator`; rely on a global `ValidationPipe`.
4. Register the provider in the module's `providers`; `exports` it only if another module needs it.
5. Import the feature module where it's consumed.

## Patterns
- Constructor injection only; providers are singletons unless you set a scope.
- Use tokens (`@Inject('X')`) for non-class providers (config, factories).
- Cross-cutting concerns: Guard (authz), Interceptor (transform/log), Pipe (validate/transform), Exception filter (error shape).
- Throw `HttpException` subclasses (`NotFoundException`, …) — don't return error objects.

## Example: a provider consuming another module's export
```ts
@Injectable()
export class BillingService {
  constructor(private readonly cats: CatsService) {}
}
// BillingModule: imports: [CatsModule]  (CatsModule must export CatsService)
```

## Verify
After changes, run `list_routes` / `module_graph` again to confirm the route and DI
graph look as intended, then run the app's tests.
