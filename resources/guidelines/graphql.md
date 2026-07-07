## GraphQL (@nestjs/graphql)

- Prefer the **code-first** approach: define types with `@ObjectType()`/`@Field()` and let Nest generate the schema.
- Resolvers are providers annotated with `@Resolver(() => Cat)`; use `@Query`, `@Mutation`, and `@ResolveField` for relations.
- Solve N+1 with DataLoader (request-scoped) in `@ResolveField` handlers.
- Validate inputs with `@InputType()` DTOs + `class-validator`, same as REST.
- Keep resolvers thin — delegate to services exactly like controllers.
