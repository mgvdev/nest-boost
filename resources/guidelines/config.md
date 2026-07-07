## Configuration (@nestjs/config)

- Import `ConfigModule.forRoot({ isGlobal: true })` once in the root module.
- Read values through `ConfigService.get<T>('KEY')` — do not read `process.env` directly in feature code.
- Group related settings with namespaced config factories (`registerAs('db', () => ({...}))`) and inject with `@Inject(dbConfig.KEY)`.
- Validate env at boot with a `validationSchema` (Joi) or a `validate` function so a
  missing/invalid variable fails fast instead of at first use.
- Never commit secrets; load them from the environment. `.env` is for local dev only.
