---
name: nestjs-docs
description: Look up authoritative, current NestJS documentation from the official docs source on GitHub. Use when you need exact API details, configuration options, or how a NestJS feature works and don't want to rely on memory.
---

# NestJS Docs Lookup

Use this skill when you need the **authoritative** answer for a NestJS feature —
exact decorators, module options, or recommended patterns — instead of guessing.

The official documentation content lives as Markdown in the NestJS docs repo:

- Browse: https://github.com/nestjs/docs.nestjs.com/tree/master/content
- Fetch raw Markdown:
  `https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/<area>/<page>.md`

## How to use
1. Map the topic to an area + page (see the map below).
2. Fetch the raw Markdown URL and read the relevant section.
3. If unsure of the exact filename, fetch the directory listing on GitHub
   (`/tree/master/content/<area>`) and pick the page, then fetch its raw URL.

## Topic → path map (`content/…`)
- Core: `first-steps.md`, `controllers.md`, `providers.md`, `modules.md`, `middlewares.md`, `exception-filters.md`, `pipes.md`, `guards.md`, `interceptors.md`, `custom-decorators.md`
- Fundamentals: `fundamentals/dependency-injection.md`, `fundamentals/dynamic-modules.md`, `fundamentals/custom-providers.md`, `fundamentals/async-providers.md`, `fundamentals/injection-scopes.md`, `fundamentals/lifecycle-events.md`, `fundamentals/discovery-service.md`
- Techniques: `techniques/configuration.md`, `techniques/validation.md`, `techniques/caching.md`, `techniques/queues.md`, `techniques/task-scheduling.md`, `techniques/logger.md`, `techniques/database.md`, `techniques/mongodb.md`, `techniques/file-upload.md`, `techniques/serialization.md`, `techniques/events.md`
- Security: `security/authentication.md`, `security/authorization.md`, `security/encryption-hashing.md`, `security/helmet.md`, `security/cors.md`, `security/rate-limiting.md`
- GraphQL: `graphql/quick-start.md`, `graphql/resolvers.md`, `graphql/mutations.md`, `graphql/subscriptions.md`, `graphql/scalars.md`
- Microservices: `microservices/basics.md`, `microservices/redis.md`, `microservices/kafka.md`, `microservices/grpc.md`
- WebSockets: `websockets/gateways.md`
- OpenAPI: `openapi/introduction.md`, `openapi/decorators.md`, `openapi/operations.md`
- Recipes: `recipes/` (e.g. `recipes/prisma.md`, `recipes/mongodb.md`, `recipes/hot-reload.md`, `recipes/repl.md`)
- CLI: `cli/overview.md`, `cli/usages.md`

## Tips
- Prefer the docs over memory for exact option names and signatures.
- Cross-check the version — this project's Nest version is available from the
  `nest-boost` `application_info` tool. The docs `master` branch tracks the latest release.
