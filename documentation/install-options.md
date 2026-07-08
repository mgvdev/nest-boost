# Install options

`install` records four choices in `nest-boost.json`; each tailors the guidelines/skills the
agent receives. All are promptable, and all have a flag for non-interactive use.

## Architecture style (`--arch`)

One style for the whole project (or monorepo). Composes an architecture guideline and installs
a matching skill.

| Value | For | Skill |
| --- | --- | --- |
| `standard` *(default)* | Classic layered Nest: module → controller → service | `architecture-standard` |
| `cqrs` | `@nestjs/cqrs`: commands, queries, events, handlers, sagas | `architecture-cqrs` |
| `hexagonal` | Ports & adapters: domain / application / infrastructure | `architecture-hexagonal` |

## Auth strategy (`--auth`)

Defaulted from your dependencies: Better Auth if `better-auth`/`@thallesp/nestjs-better-auth`
is present, else Passport if `@nestjs/passport`/`passport`/`@nestjs/jwt`, else none.

| Value | For | Skill |
| --- | --- | --- |
| `none` *(default)* | No auth guidance | — |
| `passport` | `@nestjs/passport` + JWT | `auth-passport` |
| `better-auth` | Better Auth via `@thallesp/nestjs-better-auth` | `auth-better-auth` |

Choosing **Better Auth** also lets nest-boost fetch the official community skill: pass
`--fetch-auth-skill` (runs `npx skills add better-auth/skills`), or accept the interactive
prompt. The `auth-better-auth` skill points the agent at `better-auth.com/llms.txt`.

## Test layout (`--test-layout`)

Where test files live; composes a guideline the testing skills follow.

| Value | Layout |
| --- | --- |
| `colocated` *(default)* | `*.spec.ts` next to the source; e2e in `test/` |
| `colocated-subfolder` | unit specs in `__tests__/` beside the source; e2e in `test/` |
| `central` | all under `test/`, split into `unit/` and `feature/`, mirroring `src/` |

## Runner (`--runner`)

The launcher written into the generated MCP config. Default `npx` →
`npx -y @mgvdev/nest-boost mcp`; `bunx` → `bunx @mgvdev/nest-boost mcp`. Both resolve the same
package; pick whichever your environment has.

## Evaluate (`--disable-evaluate`)

The [`evaluate`](./evaluate.md) REPL tool is **enabled by default** but is **development-only**
(blocked when `NODE_ENV=production`). Pass `--disable-evaluate` to turn it off, or set
`"evaluate": { "enabled": false }` in `nest-boost.json`.
