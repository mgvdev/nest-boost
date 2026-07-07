---
name: graphql-development
description: Build a GraphQL API in NestJS with the code-first approach — object/input types, resolvers, field resolvers, and avoiding N+1. Use when adding GraphQL types or resolvers with @nestjs/graphql.
---

# GraphQL in NestJS (code-first)

## When to use this skill
Use when adding GraphQL object types, input types, queries, mutations, or resolvers.

## Define types (code-first)
```ts
@ObjectType()
export class Cat {
  @Field(() => Int) id: number;
  @Field() name: string;
}

@InputType()
export class CreateCatInput {
  @Field() @IsString() name: string;
}
```

## Resolvers
```ts
@Resolver(() => Cat)
export class CatsResolver {
  constructor(private readonly cats: CatsService) {}

  @Query(() => [Cat]) cats() { return this.cats.findAll(); }
  @Mutation(() => Cat) createCat(@Args('input') input: CreateCatInput) { return this.cats.create(input); }
  @ResolveField(() => [Toy]) toys(@Parent() cat: Cat) { return this.cats.toysFor(cat.id); }
}
```

## Rules
- Keep resolvers thin — delegate to services, like controllers.
- Validate inputs with `class-validator` on `@InputType()` DTOs.
- Solve N+1 in `@ResolveField` with a request-scoped DataLoader.
- Register the resolver as a provider in its module.

## Ground yourself
Use `application_info` to confirm the GraphQL driver (Apollo/Mercurius) and version in use.
