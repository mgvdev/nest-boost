## Test Layout: Colocated in `__tests__/`

Keep tests near the code, grouped in a `__tests__/` folder per feature.

- **Unit / integration**: `<name>.spec.ts` inside a `__tests__/` folder **next to the source**
  (e.g. `src/cats/cats.service.ts` → `src/cats/__tests__/cats.service.spec.ts`).
- **E2E**: `test/<feature>.e2e-spec.ts` at the project root.
- Ensure Jest's `roots`/`testRegex` include `__tests__` (the default `.*\\.spec\\.ts$` regex
  already matches; just don't restrict `roots` to exclude these folders).

When you create a feature, add its `__tests__/` folder and the matching spec alongside.
