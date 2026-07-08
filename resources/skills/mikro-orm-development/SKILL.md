---
name: mikro-orm-development
description: Build the persistence layer with MikroORM in NestJS — entities, repositories, the EntityManager unit of work (flush), request context, and transactions. Use when modeling data or querying with @mikro-orm/nestjs.
---

# MikroORM in NestJS

## When to use this skill
Use when adding entities, repositories, or queries with `@mikro-orm/nestjs`. MikroORM is a
**Data Mapper / Unit of Work** ORM — its identity map + `flush()` model differs from
Active Record ORMs, so read the rules below.

## Install
`bun add @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql` (swap the driver package).

## Wire it up
`forRoot()` requires explicit config (v7+ — no empty call). Enable `autoLoadEntities` to pick
up `forFeature()` entities:

```ts
MikroOrmModule.forRoot({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  autoLoadEntities: true,
})
```

Per feature: `MikroOrmModule.forFeature([Photo])` provides the repository.

## Entity + repository + EntityManager
```ts
@Entity()
export class Photo {
  @PrimaryKey() id: number;
  @Property() name: string;
}

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo) private readonly repo: EntityRepository<Photo>,
    private readonly em: EntityManager, // import from your DRIVER package, not @mikro-orm/core
  ) {}

  async create(name: string) {
    const photo = this.repo.create({ name });
    await this.em.flush();  // persist tracked changes (batched INSERT/UPDATE)
    return photo;
  }
}
```

## Unit of work — the key mental model
- The `EntityManager` tracks loaded/created entities in an **identity map**. Mutating a managed
  entity and calling `em.flush()` persists it — you rarely call `save()` per entity.
- Nest's MikroORM middleware forks a **fresh EntityManager per HTTP request** (clean identity
  map, no cross-request leakage). Don't share an `em` across requests.
- **Outside an HTTP request** (queue processors, `@Cron`, CLI), there's no request context —
  decorate the method with `@CreateRequestContext()` so it runs in an isolated context:

```ts
@Injectable()
export class TasksService {
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async nightly() { /* em is valid here */ }
}
```
  Do **not** nest `@CreateRequestContext()` methods. Use `@EnsureRequestContext()` to reuse one if present.

## Transactions
```ts
await this.em.transactional(async (em) => {
  em.create(Photo, { name: 'a' });
  em.create(Photo, { name: 'b' });
}); // commits + flushes on success, rolls back on throw
```

## Rules
- Always `flush()` after create/update/delete — nothing hits the DB until you do.
- Keep entities as mappings; business logic in services or custom repositories
  (`@Entity({ repository: () => PhotoRepository })` + `[EntityRepositoryType]` for inference).
- Don't run `ClassSerializerInterceptor` over managed entities — MikroORM wraps relations in
  `Reference`/`Collection`; use MikroORM's serialization (`@Property({ hidden })`, `serializer`) or `serialize()`.
- Evolve schema with the MikroORM migrator, not schema-sync in production.
- `app.enableShutdownHooks()` so the connection closes cleanly.

## Testing
Provide a mocked repository via its token: `{ provide: getRepositoryToken(Photo), useValue: mock }`.

## Ground yourself
Use the `nest-boost` `db_schema` tool to see the real database schema (after migrations) and `db_query` to sample rows read-only. Use the `nest-boost` `module_graph` tool to confirm the entity's repository is registered in
the module where you inject it.
