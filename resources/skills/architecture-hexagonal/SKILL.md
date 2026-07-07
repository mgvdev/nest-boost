---
name: architecture-hexagonal
description: Build NestJS features with hexagonal (ports & adapters) architecture — pure domain, use-cases, ports, and infrastructure adapters bound via DI tokens. Use when adding a feature in a project that follows hexagonal/clean architecture.
---

# Hexagonal Architecture (ports & adapters)

## When to use this skill
Use when adding or restructuring a feature in a hexagonal/clean project. Dependencies
point inward: infrastructure → application → domain. The domain must not import Nest or ORM code.

## Folder shape (per feature)
```
src/<feature>/
  domain/                     entities, value objects (pure TS)
    ports/                    interfaces the app depends on (e.g. cat.repository.port.ts)
  application/
    use-cases/*.use-case.ts   orchestrate the domain via ports
  infrastructure/
    persistence/*.repository.ts   adapter implementing a port (TypeORM/Prisma)
    http/*.controller.ts          driving adapter
  <feature>.module.ts         binds ports → adapters
```

## Add a feature
1. Define the **port** in `domain/ports`:
   `export interface CatRepositoryPort { save(cat: Cat): Promise<void>; }`
   plus a token: `export const CAT_REPOSITORY = Symbol('CAT_REPOSITORY');`
2. Write the **use-case** in `application/use-cases` depending on the port (constructor `@Inject(CAT_REPOSITORY)`).
3. Implement the **adapter** in `infrastructure/persistence` (`implements CatRepositoryPort`).
4. Bind in the module:
```ts
providers: [
  CreateCatUseCase,
  { provide: CAT_REPOSITORY, useClass: TypeOrmCatRepository },
]
```
5. Controller (driving adapter) translates HTTP → use-case → HTTP.

## Rules
- Domain imports nothing from `@nestjs/*` or infrastructure.
- Use-cases depend on ports, never concrete adapters or ORM types.
- Map between domain models and ORM entities inside the adapter (no persistence decorators on domain models).

## Ground yourself
Use `module_graph` to verify each port token resolves to exactly one adapter (`useClass`/`useValue`).
