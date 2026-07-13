---
name: testing-vitest
description: Write NestJS unit and e2e tests with @nestjs/testing and Vitest — building testing modules, overriding providers, and testing HTTP with supertest. Use when the project uses Vitest.
---

# NestJS Testing (Vitest)

## When to use
Use when the NestJS project is configured with Vitest (default for new ESM projects in NestJS 12).

## Project setup

Add the dependencies:

```bash
npm i -D vitest @nestjs/testing supertest @types/supertest
```

Create a `vitest.config.ts` for a NestJS ESM project:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
  },
});
```

Use `import { ... } from "vitest"` in spec files; do not rely on globals unless `globals: true` is set.

## Unit test a provider

```ts
import { Test } from "@nestjs/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("CatsService", () => {
  let service: CatsService;
  const mockRepo = { find: vi.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CatsService, { provide: CatsRepository, useValue: mockRepo }],
    }).compile();
    service = moduleRef.get(CatsService);
  });

  it("returns cats", async () => {
    mockRepo.find.mockResolvedValue([{ id: 1, name: "Mittens" }]);
    await expect(service.findAll()).resolves.toHaveLength(1);
  });
});
```

- Use `.overrideProvider(Dep).useValue(mock)` to replace a dependency without listing it.
- Mock at the boundary (repositories, HTTP clients), not the class under test.

## E2E test an endpoint

```ts
import { Test } from "@nestjs/testing";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

describe("Cats (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /cats", async () => {
    await request(app.getHttpServer()).get("/cats").expect(200);
  });
});
```

## Conventions
- One behaviour per test; name tests by behaviour.
- Keep tests deterministic — no real network or DB. Use in-memory fakes or test containers.
- Reset mocks between tests (`afterEach(() => vi.clearAllMocks())`).
- Run with `vitest` or `bun test` when configured with Bun's Vitest runner.
- Place tests per the project's **test-layout** convention.

## Ground yourself
Use the `nest-boost` `module_graph` tool to see a provider's real dependencies before deciding what to mock.
