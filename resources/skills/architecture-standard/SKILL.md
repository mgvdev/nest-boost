---
name: architecture-standard
description: Structure NestJS features the standard layered way — feature module with controller, service, DTOs, and entities. Use when adding or organizing a feature in a project that follows the standard Nest architecture.
---

# Standard (Layered) Architecture

## When to use this skill
Use when creating or restructuring a feature in a project that follows conventional
layered NestJS modules.

## Folder shape (per feature)
```
src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts    # thin HTTP boundary
  <feature>.service.ts       # business logic
  dto/                       # class-validator DTOs
  entities/                  # persistence models
```

## Flow
1. `nest generate module <feature>` then `controller` + `service`.
2. Controller: validate (DTO) → call service → return. No logic.
3. Service: business logic, depends on repositories/other services via DI.
4. Export the service from the module only if another module needs it.

## Rules
- No business logic in controllers.
- No cross-feature imports of internal providers — import the module and use its exported service.
- One responsibility per service; split when it grows.

## Ground yourself
Use `module_graph` to see existing modules/exports before wiring a new dependency,
and `list_routes` before adding a route.
