---
name: zod-development
description: Validate requests and responses in NestJS with Zod and Standard Schema support. Use when the project uses Zod for DTOs or route decorators.
---

# Zod in NestJS

## When to use
Use when the project chose Zod as its schema library, especially on NestJS 12+ where route decorators accept `{ schema: ... }`.

## Define a schema

```ts
import { z } from "zod";

export const createCatSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

## Use in route decorators

```ts
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { createCatSchema } from "./create-cat.schema";

@Controller("cats")
export class CatsController {
  @Post()
  create(@Body({ schema: createCatSchema }) dto: CreateCatDto) {
    // dto is already validated by the framework
  }

  @Get(":id")
  findOne(@Param("id", { schema: z.coerce.number().int().positive() }) id: number) {
    return id;
  }
}
```

## Standard schema objects
If the schema is exported from a `.schema.ts` file, reuse it across the service layer and tests to keep a single source of truth.

## Response validation
Pair with a custom interceptor or the serializer interceptor when response schemas are required.

## Verify
After adding schemas, run `list_routes` to confirm the route shape and tests to verify validation behavior.
