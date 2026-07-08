## Test Layout: Central `test/` folder (Unit + Feature)

All tests live under a top-level `test/` folder, **mirroring** the `src/` structure, split by
kind:

```
test/
  unit/       # fast, isolated unit tests        → test/unit/cats/cats.service.spec.ts
  feature/    # e2e / integration (HTTP, DB)     → test/feature/cats/cats.e2e-spec.ts
```

- Mirror the source path under `unit/` or `feature/` (`src/cats/cats.service.ts` →
  `test/unit/cats/cats.service.spec.ts`).
- Name unit specs `*.spec.ts` and feature/e2e specs `*.e2e-spec.ts`.
- Configure Jest with `rootDir: '.'` and `roots: ['<rootDir>/test']` (or per-kind projects),
  since specs are no longer beside the source. Keep a separate config/project for `feature`.
- In a monorepo, use `test/` inside each app (`apps/<app>/test/unit|feature`).

When you add a feature under `src/`, create the matching `test/unit/...` (and `test/feature/...`
when it has HTTP/DB behavior) path.
