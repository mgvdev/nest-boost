---
name: valibot-development
description: Validate requests and responses in NestJS with Valibot and Standard Schema support. Use when the project uses Valibot for DTOs or route decorators.
---

# Valibot in NestJS

## When to use
Use when the project chose Valibot as its schema library, especially on NestJS 12+ where route decorators accept `{ schema: ... }`.

## Define a schema

```ts
import * as v from "valibot";

export const createCatSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  age: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export type CreateCatDto = v.InferOutput<typeof createCatSchema>;
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
  findOne(@Param("id", { schema: v.pipe(v.string(), v.transform(Number), v.integer()) }) id: number) {
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
