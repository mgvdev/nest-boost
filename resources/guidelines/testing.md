## Testing

NestJS 12 defaults to **Vitest** for new ESM projects and keeps **Jest** for CJS schematics. Use the test runner already configured in the project.

### Unit tests
- Build a testing module and override dependencies:

```ts
const moduleRef = await Test.createTestingModule({
  providers: [CatsService, { provide: CatsRepository, useValue: mockRepo }],
}).compile();
const service = moduleRef.get(CatsService);
```

- Prefer `.overrideProvider(X).useValue(mock)` to swap real dependencies for fakes.
- Mock at the boundary (repositories, HTTP clients), not the unit under test.

### E2E tests
- Boot the app with `createNestApplication()` and use an HTTP client (e.g. `supertest`) to assert status + body.
- With Vitest, prefer `testcontainers` or in-memory fakes; keep tests deterministic (no real network/DB).

### Conventions
- One behaviour per test; name tests by the behaviour, not the method.
- Reset mocks between tests (`afterEach` / `vi.clearAllMocks()` / `jest.clearAllMocks()` depending on the runner).
- Place tests per the project's **test-layout** convention.

### Run
- Jest projects: `jest` or `bun test`.
- Vitest projects: `vitest` or `bun test` when configured with Bun's Vitest runner.
