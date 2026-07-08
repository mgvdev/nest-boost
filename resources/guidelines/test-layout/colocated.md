## Test Layout: Colocated (Nest default)

Place tests next to the code they cover.

- **Unit / integration**: `<name>.spec.ts` in the **same folder** as the source file
  (e.g. `src/cats/cats.service.ts` → `src/cats/cats.service.spec.ts`).
- **E2E**: `test/<feature>.e2e-spec.ts` at the project root (the default `test/` folder).
- Jest picks these up with the default `testRegex: '.*\\.spec\\.ts$'` (unit) and the separate
  `test/jest-e2e.json` config for e2e.

When you create a provider/controller, create its `.spec.ts` beside it in the same move.
