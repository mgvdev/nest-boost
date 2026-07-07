## Architecture: Standard (layered modules)

This project uses the conventional NestJS layered structure. Organise by **feature module**.

```
src/
  <feature>/
    <feature>.module.ts
    <feature>.controller.ts        # HTTP boundary — thin
    <feature>.service.ts           # business logic
    dto/                           # request/response DTOs (class-validator)
    entities/                      # persistence models
  app.module.ts
```

Rules:
- Controller validates + delegates; **all** business logic lives in the service.
- Service depends on repositories/other services via constructor DI.
- A module `exports` only the services other modules need; consumers `imports` the module.
- No cross-feature imports of internal providers — go through the exported service.
- Scaffold with `nest generate module|controller|service <feature>`.
