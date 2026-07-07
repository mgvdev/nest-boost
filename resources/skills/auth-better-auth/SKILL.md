---
name: auth-better-auth
description: Implement authentication in NestJS with Better Auth via @thallesp/nestjs-better-auth — AuthModule setup, session decorators, and route access control. Use when adding or changing auth in a Better Auth project.
---

# Auth with Better Auth (NestJS)

## When to use this skill
Use when setting up or changing authentication in a NestJS project that uses
[Better Auth](https://better-auth.com) through `@thallesp/nestjs-better-auth`.

## Get the authoritative source first
Better Auth moves fast — prefer official docs over memory:
- Docs index (LLM-friendly): **https://better-auth.com/llms.txt** — fetch it, find the
  relevant page (adapters, plugins, providers, concepts), then fetch that page.
- NestJS integration: https://better-auth.com/docs/integrations/nestjs
- Official agent skill (richer, community-maintained): run **`npx skills add better-auth/skills`**.

## Setup
1. Install: `better-auth` + `@thallesp/nestjs-better-auth`.
2. Create the server instance in `src/auth.ts`:
   ```ts
   export const auth = betterAuth({ database: /* adapter */, emailAndPassword: { enabled: true } });
   ```
3. Disable Nest's body parser (Better Auth needs raw bodies):
   ```ts
   const app = await NestFactory.create(AppModule, { bodyParser: false });
   ```
4. Register the module:
   ```ts
   @Module({ imports: [AuthModule.forRoot({ auth })] })
   export class AppModule {}
   ```

## Access control (routes are protected by default)
- `@Session()` — inject the current session/user into a handler.
- `@AllowAnonymous()` — allow unauthenticated access to a route.
- `@OptionalAuth()` — auth optional; session provided if present.

```ts
@Controller('me')
export class MeController {
  @Get()
  me(@Session() session: UserSession) { return session.user; }

  @Get('public')
  @AllowAnonymous()
  open() { return { ok: true }; }
}
```

## Rules
- Configure providers/sessions/plugins on the `auth` instance (server side), not in controllers.
- Don't add a second global auth guard — Better Auth already registers one globally.
- Keep secrets/DB config in env via `ConfigService`.

## Ground yourself
Use `list_routes` to confirm which handlers are anonymous vs protected, and
`application_info` to confirm `@thallesp/nestjs-better-auth` + `better-auth` versions.
