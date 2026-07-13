---
name: oxlint-development
description: Configure and run oxlint in a NestJS project. Use when the project uses oxlint as its linter (default for new ESM projects in NestJS 12).
---

# oxlint in NestJS

## When to use
Use when the project uses oxlint as its linter. NestJS 12 ESM projects default to oxlint instead of ESLint.

## Installation

```bash
npm i -D oxlint
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "lint": "oxlint"
  }
}
```

## Configuration

Create `.oxlintrc.json` at the project root:

```json
{
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "no-console": "off",
    "no-debugger": "error"
  }
}
```

oxlint supports many ESLint rules out of the box and runs an order of magnitude faster. Keep the config small; disable rules only when they conflict with the project's style.

## Run

```bash
bun run lint
# or
npx oxlint
```

## CI

Add the lint step before tests:

```bash
bun run lint && bun run typecheck && bun test
```

## Migration from ESLint

- Remove `.eslintrc*`, `eslint.config.*`, and `eslint` from dependencies.
- Convert essential rules to `.oxlintrc.json`.
- Keep Prettier for formatting if the team used it.
