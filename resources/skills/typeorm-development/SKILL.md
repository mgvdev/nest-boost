---
name: typeorm-development
description: Build the persistence layer with TypeORM in NestJS — entities, repositories, relations, transactions, and migrations. Use when modeling data or writing queries with @nestjs/typeorm.
---

# TypeORM in NestJS

## When to use this skill
Use when adding entities, repositories, relations, transactions, or migrations with
`@nestjs/typeorm`.

## Install
`bun add @nestjs/typeorm typeorm pg` (or `mysql2`, etc.).

## Wire it up
- Root connection once, async so config comes from `ConfigService`:

```ts
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (c: ConfigService) => ({
    type: 'postgres',
    url: c.get('DATABASE_URL'),
    autoLoadEntities: true,   // picks up every forFeature() entity
    synchronize: false,       // NEVER true outside local dev
  }),
})
```

- Per feature: `TypeOrmModule.forFeature([Cat])` in the feature module — this provides `Repository<Cat>`.

## Entity + repository
```ts
@Entity()
export class Cat {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @ManyToOne(() => Owner, (o) => o.cats) owner: Owner;
}

@Injectable()
export class CatsService {
  constructor(@InjectRepository(Cat) private readonly repo: Repository<Cat>) {}
  findAll() { return this.repo.find({ relations: { owner: true } }); }
}
```

## Transactions
Prefer `DataSource.transaction` (auto connect/commit/rollback/release):

```ts
constructor(private readonly dataSource: DataSource) {}

await this.dataSource.transaction(async (manager) => {
  await manager.save(a);
  await manager.save(b);
});
```

Use a manual `QueryRunner` only when you need fine control — and always `release()` in `finally`.

## Rules
- Entities hold shape, not business logic — query logic lives in services or custom repositories.
- **`synchronize: true` is banned in production** (silent data loss). Evolve schema with
  migrations: `typeorm migration:generate`, run them on deploy.
- Avoid N+1: load relations with `relations`/`leftJoinAndSelect`, not per-row lookups.
- Select only needed columns; paginate large reads (`take`/`skip`).
- Parameterise any raw SQL — never string-concatenate input.

## Testing
Provide a mock repository via the injection token:

```ts
{ provide: getRepositoryToken(Cat), useValue: mockRepo }
```

## Ground yourself
Use the `nest-boost` `db_schema` tool to see the real database schema (after migrations) and `db_query` to sample rows read-only. Use the `nest-boost` `module_graph` tool to confirm which module registers a given entity's
repository before injecting it elsewhere.
