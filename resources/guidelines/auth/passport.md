## Auth: Passport (@nestjs/passport + JWT)

This project authenticates with Passport strategies and JWT.

- Implement strategies as providers extending `PassportStrategy(Strategy)`; register them in an `AuthModule`.
- Protect routes with guards: `@UseGuards(AuthGuard('jwt'))` or a custom `JwtAuthGuard`.
- Issue tokens via `JwtService.sign(payload)`; configure secret/expiry with `JwtModule.registerAsync` + `ConfigService`.
- Put the authenticated user on the request in the strategy's `validate()` return; read it with a `@CurrentUser()` param decorator.
- Role checks: combine a `RolesGuard` with a `@Roles()` metadata decorator read via `Reflector`.
- Never hand-roll password hashing — use `argon2`/`bcrypt`. Never log tokens or secrets.
- Register global auth with `APP_GUARD` only if most routes are protected; expose public routes with a `@Public()` decorator the guard respects.
