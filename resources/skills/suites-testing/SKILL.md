---
name: suites-testing
description: Write fast, isolated NestJS unit tests with Suites (formerly Automock) — solitary and sociable TestBed, auto-mocked dependencies, and typed mocks. Use when unit-testing providers in a project that uses @suites/unit.
---

# Suites (Automock) testing in NestJS

## When to use this skill
Use when writing unit tests for providers with **Suites** (`@suites/unit`). Suites
auto-generates typed mocks for a class's constructor dependencies, so you don't hand-build a
`Test.createTestingModule` with a provider list per test. For full app / HTTP (e2e) tests,
use `@nestjs/testing` + supertest instead (see `testing-jest`).

## Install
```bash
bun add -d @suites/unit @suites/di.nestjs @suites/doubles.jest
```
(Adapters also exist: `@suites/doubles.vitest`, `@suites/doubles.sinon`.)

Add the type references in a `global.d.ts`:
```ts
/// <reference types="@suites/doubles.jest/unit" />
/// <reference types="@suites/di.nestjs/types" />
```

## Solitary test — unit fully isolated (all deps mocked)
```ts
import { TestBed, type Mocked } from '@suites/unit';

let service: UserService;
let repo: Mocked<UserRepository>;

beforeAll(async () => {
  const { unit, unitRef } = await TestBed.solitary(UserService).compile();
  service = unit;
  repo = unitRef.get(UserRepository); // typed auto-mock of the dependency
});

it('returns the user', async () => {
  repo.findById.mockResolvedValue({ id: '1' });
  await expect(service.get('1')).resolves.toEqual({ id: '1' });
});
```

## Pre-configure a mock before compile
```ts
const { unit, unitRef } = await TestBed.solitary(UserService)
  .mock(UserRepository)
  .impl((stubFn) => ({ findById: stubFn().mockResolvedValue({ id: '1' }) }))
  .compile();
```
`stubFn` adapts to the underlying framework (`jest.fn()` / `vi.fn()` / sinon stub).

## Sociable test — mix real + mocked collaborators
Use when you want a real collaborator exercised alongside mocks:
```ts
const { unit, unitRef } = await TestBed.sociable(UserService)
  .expose(UserMapper)         // real
  .mock(UserRepository).impl(/* ... */) // mocked
  .compile();
```

## Retrieve dependencies
- `unitRef.get(UserRepository)` — by class.
- `unitRef.get<ConfigOptions>(CONFIG_OPTIONS)` — by injection token.

## Direct mock (no TestBed)
```ts
import { mock } from '@suites/unit';
const repo = mock<UserRepository>();
```

## Rules
- Prefer **solitary** for pure unit tests (fast, no DI graph). Reach for **sociable** only when
  a collaborator's real behavior is part of what you're testing.
- One behaviour per test; arrange mocks with `.mock().impl()` or on the retrieved `Mocked<T>`.
- Suites is for **providers**, not controllers-over-HTTP or full-app wiring — use `@nestjs/testing` for those.
- Place tests per the project's **test-layout** convention (see these guidelines).

## Ground yourself
Use the `nest-boost` `module_graph` tool to see a provider's real constructor dependencies
before deciding what to mock or expose.
