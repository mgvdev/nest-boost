## Testing (Jest + @nestjs/testing)

- Unit-test providers by building a testing module and overriding dependencies:

```ts
const moduleRef = await Test.createTestingModule({
  providers: [CatsService, { provide: CatsRepository, useValue: mockRepo }],
}).compile();
const service = moduleRef.get(CatsService);
```

- Prefer `.overrideProvider(X).useValue(mock)` to swap real dependencies for fakes.
- E2E-test HTTP with `supertest` against a booted app from `createNestApplication()`; assert status + body.
- One behaviour per test; name tests by the behaviour, not the method.
- Mock at the boundary (repositories, HTTP clients), not the unit under test.
- Run with `bun test` or `jest`; keep tests deterministic (no real network/DB).
