## Architecture: Hexagonal (ports & adapters)

This project isolates the domain from frameworks and I/O. Dependencies point
**inward**: infrastructure → application → domain. The domain knows nothing about Nest.

```
src/
  <feature>/
    domain/                         # entities, value objects, domain services — pure TS, no Nest
      ports/                        # interfaces the app needs (e.g. CatRepositoryPort)
    application/                    # use-cases orchestrating the domain
      use-cases/<name>.use-case.ts
    infrastructure/                 # adapters implementing ports
      persistence/<x>.repository.ts  # e.g. TypeORM adapter implements CatRepositoryPort
      http/<feature>.controller.ts   # driving adapter
    <feature>.module.ts             # binds ports → adapters via DI tokens
```

Rules:
- Define **ports** (interfaces) in the domain; **adapters** in infrastructure implement them.
- Bind them in the module with injection tokens:
  `{ provide: CAT_REPOSITORY, useClass: TypeOrmCatRepository }`; inject via `@Inject(CAT_REPOSITORY)`.
- Use-cases depend on ports, never on concrete adapters or ORM types.
- Domain layer imports nothing from `@nestjs/*` or infrastructure.
- Controllers are driving adapters: translate HTTP → use-case call → HTTP response.
- Keep domain models free of persistence decorators; map to/from ORM entities in the adapter.
