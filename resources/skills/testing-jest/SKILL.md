---
name: testing-jest
description: Write NestJS unit and e2e tests with @nestjs/testing and Jest — building testing modules, overriding providers, and testing HTTP with supertest. Use when adding or fixing tests for a NestJS app.
---

# NestJS Testing (Jest)

## When to use this skill
Use when writing or fixing tests for NestJS providers, controllers, or HTTP endpoints.

## Unit test a provider
Build a testing module and swap real dependencies for fakes:

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    CatsService,
    { provide: getRepositoryToken(Cat), useValue: mockRepo }, // or a plain mock
  ],
}).compile();

const service = moduleRef.get(CatsService);
```

- Use `.overrideProvider(Dep).useValue(mock)` to replace a dependency without listing it.
- Mock at the boundary (repositories, HTTP clients), not the class under test.

## E2E test an endpoint
```ts
const app = moduleRef.createNestApplication();
await app.init();
await request(app.getHttpServer()).get('/cats').expect(200);
await app.close();
```

## Conventions
- One behaviour per test; name tests by behaviour.
- Keep tests deterministic — no real network or DB. Use in-memory fakes or test containers.
- Reset mocks between tests (`afterEach(() => jest.clearAllMocks())`).
- Run with `bun test`, `jest`, or `nest`'s configured test script.

- Place tests per the project's **test-layout** convention (see these guidelines).

## Ground yourself
Use the `nest-boost` `module_graph` tool to see a provider's real dependencies before
deciding what to mock.
