---
name: auth-passport
description: Implement authentication in NestJS with Passport and JWT — strategies, AuthGuard, token issuance, current-user and roles. Use when adding login, protecting routes, or working with auth in a Passport-based project.
---

# Auth with Passport (NestJS)

## When to use this skill
Use when adding login/signup, protecting routes, issuing JWTs, or reading the current
user in a project that uses `@nestjs/passport`.

## Building blocks
- **Strategy** (provider extending `PassportStrategy(Strategy)`) validates credentials/tokens; its `validate()` return becomes `request.user`.
- **Guard** (`AuthGuard('jwt')` or a custom `JwtAuthGuard`) protects routes.
- **JwtService** issues/verifies tokens; configure via `JwtModule.registerAsync`.

## Add JWT auth (typical)
1. `AuthModule`: import `PassportModule` + `JwtModule.registerAsync({ useFactory: (c) => ({ secret: c.get('JWT_SECRET'), signOptions: { expiresIn: '15m' } }), inject: [ConfigService] })`.
2. `JwtStrategy extends PassportStrategy(Strategy)` reads the bearer token, `validate(payload)` returns the user.
3. `AuthService.login()` verifies the password (`argon2`/`bcrypt`) and returns `jwt.sign(payload)`.
4. Protect routes with `@UseGuards(JwtAuthGuard)`.
5. Read the user with a `@CurrentUser()` param decorator (`createParamDecorator`).

## Roles
`@Roles('admin')` metadata + a `RolesGuard` that reads it via `Reflector` and checks `request.user.roles`.

## Global auth
Register `{ provide: APP_GUARD, useClass: JwtAuthGuard }` and mark public routes with a
`@Public()` decorator the guard checks — don't leave routes unprotected by accident.

## Rules
- Never store plaintext passwords; hash with argon2/bcrypt. Never log tokens.
- Keep secrets in `ConfigService`, not literals.

## Ground yourself
Use `list_routes` (shows guards per route) to confirm which routes are actually protected.
