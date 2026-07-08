---
name: orpc-development
description: Implement type-safe oRPC contracts in NestJS with @orpc/nest — contract definitions, the @Implement decorator, ORPCModule setup, and input/output typing. Use when adding or wiring an oRPC contract/handler in a NestJS project.
---

# oRPC in NestJS (@orpc/nest)

## When to use this skill
Use when defining an oRPC contract or implementing one in a NestJS controller — i.e. any
work with `@orpc/nest` / `@orpc/contract`.

## Get the authoritative source
oRPC evolves quickly — prefer the docs over memory:
- Docs index (LLM-friendly): **https://orpc.dev/llms.txt** — fetch it, find the page, read it.
- NestJS integration: https://orpc.dev/docs/openapi/integrations/implement-contract-in-nest

## Requirements (important)
`@orpc/nest` is **ESM-only**:
- `tsconfig.json`: `"module": "NodeNext"`, `"strict": true`.
- **Node.js 22+** (or bundle ESM → CJS for older).
- Disable Nest's body parser: `NestFactory.create(AppModule, { bodyParser: false })`.

## Install
`bun add @orpc/nest @orpc/contract zod` (contracts are validated with a schema lib, e.g. zod).

## 1. Define the contract (contract-first)
Every route needs a `path`. Use `populateContractRouterPaths()` to fill any missing ones.

```ts
import { oc, populateContractRouterPaths } from '@orpc/contract'
import * as z from 'zod'

export const listPlanetContract = oc
  .route({ method: 'GET', path: '/planets' })
  .input(z.object({ limit: z.number().optional() }))
  .output(z.array(PlanetSchema))

export const contract = populateContractRouterPaths({ planet: { list: listPlanetContract } })
```

## 2. Implement it in a controller
`@Implement` behaves like Nest's `@Get`/`@Post` — it binds a handler to a contract route.

```ts
import { Controller } from '@nestjs/common'
import { Implement, implement } from '@orpc/nest'

@Controller()
export class PlanetController {
  @Implement(contract.planet.list)
  list() {
    return implement(contract.planet.list).handler(({ input }) => {
      // input is typed from the contract's .input() schema
      return [] // must match the .output() schema
    })
  }
}
```

## 3. Register the module
```ts
import { Module } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { ORPCModule } from '@orpc/nest'

@Module({
  imports: [
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        context: { request },
        eventIteratorKeepAliveInterval: 5000,
      }),
      inject: [REQUEST],
    }),
  ],
  controllers: [PlanetController],
})
export class AppModule {}
```

## Rules
- **Contract-first**: the contract (`.input`/`.output` schemas + `path`) is the source of
  truth; the handler must satisfy it. Don't hand-validate — the schema does it.
- Keep handlers thin: delegate business logic to a service, like any Nest controller.
- Build type-safe clients from the same contract (OpenAPILink) — never redeclare shapes.
- Remember `bodyParser: false` and the ESM/NodeNext requirements, or requests fail at runtime.

## Ground yourself
Use the `nest-boost` `list_routes` tool to see how oRPC routes register alongside regular
Nest routes, and `module_graph` to confirm `ORPCModule` is imported where expected.
