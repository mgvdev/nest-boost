## Auth: Better Auth (@thallesp/nestjs-better-auth)

This project authenticates with [Better Auth](https://better-auth.com) via the
NestJS integration `@thallesp/nestjs-better-auth`.

Setup:
- Create the Better Auth instance in `src/auth.ts` (`export const auth = betterAuth({ ... })`).
- **Disable Nest's body parser** so Better Auth reads raw bodies:
  `NestFactory.create(AppModule, { bodyParser: false })`.
- Register the module: `AuthModule.forRoot({ auth })` in the root module.

Usage:
- All routes are protected by a globally-registered guard by default.
- `@Session()` — inject the current session/user in a handler.
- `@AllowAnonymous()` — allow unauthenticated access to a route.
- `@OptionalAuth()` — make auth optional but still expose the session if present.

Rules:
- Configure providers, sessions, and plugins on the `auth` instance (server), not ad-hoc in controllers.
- Do not mix a second global auth guard — Better Auth's guard already runs globally.
- For authoritative, current options (adapters, plugins, providers), consult the
  Better Auth docs index at https://better-auth.com/llms.txt and the NestJS guide
  at https://better-auth.com/docs/integrations/nestjs.
- The official Better Auth agent skill is available via `npx skills add better-auth/skills`.
