---
name: prisma-development
description: Build the persistence layer with Prisma in NestJS — PrismaService, schema + migrations, typed queries, and transactions. Use when modeling data or querying with Prisma in NestJS.
---

# Prisma in NestJS

## When to use this skill
Use when adding Prisma models, writing queries, or wiring `PrismaClient` into NestJS.

## Get the authoritative source
Prisma changes fast (v7 shipped as ESM). Prefer docs over memory:
- NestJS recipe: https://docs.nestjs.com/recipes/prisma
- Prisma docs: https://www.prisma.io/docs — many pages have an `llms.txt`-style index.

## Install & init
```bash
bun add -d prisma
bun add @prisma/client
bunx prisma init
```

## Schema + client
Define models in `schema.prisma`. **Prisma v7 is ESM by default**, which clashes with
NestJS's CommonJS build — set the generator's module format and output:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}
```

Migrate + regenerate the client after every schema change:
```bash
bunx prisma migrate dev --name init
bunx prisma generate
```

## PrismaService (single client, injectable)
Wrap `PrismaClient` in a service and export it from a `PrismaModule`. Connect on init:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

Inject it into feature services — never `new PrismaClient()` per request:

```ts
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() { return this.prisma.user.findMany(); }
}
```

## Rules
- One `PrismaService` for the whole app (a `PrismaModule`, often `@Global()`); a new client
  per request exhausts the connection pool.
- Lean on Prisma's generated types instead of duplicating DTO shapes for outputs.
- Select only what you need (`select`/`include`) and paginate (`take`/`cursor`).
- Multi-step writes go in `this.prisma.$transaction([...])` or the interactive
  `$transaction(async (tx) => { ... })` form — not separate awaited calls.
- Map known errors (`Prisma.PrismaClientKnownRequestError`, e.g. `P2002` unique) to `HttpException`s.
- Enable `app.enableShutdownHooks()` so the client disconnects cleanly.

## Testing
Provide a mocked `PrismaService` (`{ provide: PrismaService, useValue: mock }`) — or use a
throwaway test database for integration tests.

## Ground yourself
Use the `nest-boost` `db_schema` tool to see the real database schema (after migrations) and `db_query` to sample rows read-only. Use the `nest-boost` `module_graph` tool to confirm `PrismaModule`/`PrismaService` is
exported and imported where you inject it.
