## Validation (class-validator)

- Model every request body/query as a DTO class with `class-validator` decorators
  (`@IsString()`, `@IsInt()`, `@IsOptional()`, `@IsEmail()`, `@ValidateNested()`).
- Register `ValidationPipe` globally so DTOs are enforced everywhere:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
```

- `whitelist` strips unknown properties; `transform` coerces payloads into the DTO
  class instance (and primitive types when `@Type()` is set).
- Use `@Type(() => Nested)` from `class-transformer` for nested objects and arrays.
- For partial updates, derive with `PartialType(CreateXDto)` from `@nestjs/mapped-types` (or `@nestjs/swagger`).
- Never validate inside the controller by hand — the pipe is the single source of truth.
