## NestJS Core Conventions

NestJS is a modular, DI-driven Node framework. Structure code around **modules** that
own a slice of the domain and expose only what other modules need.

### Modules
- One module per feature/domain (`CatsModule`, `AuthModule`). Register its
  `controllers` and `providers`; `exports` only the providers other modules consume.
- `imports` other modules to use their exported providers — never import a provider class directly.
- Prefer `@Global()` sparingly; explicit imports keep the graph readable.
- Use `forRoot()`/`forRootAsync()` (static) for configuring library modules, `forFeature()` for per-feature registration.

### Dependency injection
- Inject via the constructor: `constructor(private readonly svc: CatsService) {}`.
- Providers are singletons by default. Only opt into `Scope.REQUEST`/`TRANSIENT` when required — request scope bubbles up and hurts performance.
- Use injection tokens (`@Inject('TOKEN')`) for non-class providers (config values, factories).

### Controllers & routing
- Controllers are thin: validate input, delegate to a service, return the result. No business logic.
- Group routes with a base path: `@Controller('cats')`. Use method decorators `@Get(':id')`, `@Post()`, etc.
- Read params with `@Param`, `@Query`, `@Body`; never touch `req`/`res` unless you must.
- On NestJS 12+, you may pass a Standard Schema to route decorators:
  `@Post() create(@Body({ schema: createCatSchema }) dto: CreateCatDto)`.
  Use this for Zod, Valibot, or ArkType; `class-validator` remains the default recommended path.

### DTOs & validation
- Define request shapes as DTO classes with `class-validator` decorators, **or** as Standard Schema objects when the project chose that style.
- Enable a global `ValidationPipe` (`whitelist: true, transform: true`) so payloads are validated and stripped.

### Cross-cutting concerns
- **Guards** for authz, **Interceptors** for transform/logging, **Pipes** for validation/transform, **Exception filters** for error shaping. Apply at method, controller, or global scope.
- Throw built-in `HttpException` subclasses (`NotFoundException`, `BadRequestException`) rather than returning error objects.

### Async & config
- Keep configuration in `@nestjs/config`; read via `ConfigService`, not `process.env` scattered through code.
- Services return `Promise`/`Observable`; let Nest await them.

### Build & quality
- NestJS 12 is ESM-first. Prefer ESM `import` syntax and review `tsconfig.json` module/moduleResolution settings.
- New ESM projects default to **Vitest** and **oxlint**. Existing Jest/eslint setups continue to work, but fresh projects should adopt the new defaults.
- The CLI build pipeline uses **Rspack** instead of webpack. Audit custom webpack plugins when upgrading.

### Before generating code
Use the `nest-boost` MCP tools to ground your work in the real app:
- `application_info` — versions, packages, counts.
- `module_graph` — where a provider lives and what a module exports.
- `list_routes` — existing routes before adding a new one (avoid collisions).
- `nest_cli` — scaffold with `generate` instead of hand-writing boilerplate.
