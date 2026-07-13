---
name: arktype-development
description: Validate requests and responses in NestJS with ArkType and Standard Schema support. Use when the project uses ArkType for DTOs or route decorators.
---

# ArkType in NestJS

## When to use
Use when the project chose ArkType as its schema library, especially on NestJS 12+ where route decorators accept `{ schema: ... }`.

## Define a schema

```ts
import { type } from "arktype";

export const createCatSchema = type({
  name: "string>1",
  age: "integer>0",
});

export type CreateCatDto = typeof createCatSchema.infer;
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
  findOne(@Param("id", { schema: type("integer>0") }) id: number) {
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
