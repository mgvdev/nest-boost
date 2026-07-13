## Validation

The project may use either `class-validator` (Nest default) or Standard Schema libraries (Zod, Valibot, ArkType) on NestJS 12+.

### class-validator
- Model every request body/query as a DTO class with `class-validator` decorators (`@IsString()`, `@IsInt()`, `@IsOptional()`, `@IsEmail()`, `@ValidateNested()`).
- Register `ValidationPipe` globally so DTOs are enforced everywhere:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
```

- `whitelist` strips unknown properties; `transform` coerces payloads into the DTO class instance (and primitive types when `@Type()` is set).
- Use `@Type(() => Nested)` from `class-transformer` for nested objects and arrays.
- For partial updates, derive with `PartialType(CreateXDto)` from `@nestjs/mapped-types` (or `@nestjs/swagger`).

### Standard Schema (NestJS 12+)
- Pass the schema directly in the route decorator:

```ts
@Post()
create(@Body({ schema: createCatSchema }) dto: CreateCatDto) { ... }

@Get(':id')
findOne(@Param('id', { schema: z.coerce.number().int().positive() }) id: number) { ... }
```

- Works with any Standard Schema library: **Zod**, **Valibot**, **ArkType**.
- The schema is validated by the framework before the handler runs; no manual validation inside the controller.
- Prefer Standard Schema when the project already chose a schema-first style; otherwise stay with `class-validator`.

### Golden rule
Never validate inside the controller by hand — the pipe/decorator is the single source of truth.
