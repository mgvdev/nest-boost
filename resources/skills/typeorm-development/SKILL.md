---
name: typeorm-development
description: Build the persistence layer with TypeORM in NestJS — entities, repositories, per-feature registration, and migrations. Use when modeling data or writing queries with @nestjs/typeorm.
---

# TypeORM in NestJS

## When to use this skill
Use when adding entities, repositories, or database queries with `@nestjs/typeorm`.

## Wire it up
- Root connection once: `TypeOrmModule.forRootAsync({ useFactory, inject: [ConfigService] })`.
- Per feature: `TypeOrmModule.forFeature([Cat])` in the feature module — this provides `Repository<Cat>`.

## Entity + repository
```ts
@Entity()
export class Cat {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
}

@Injectable()
export class CatsService {
  constructor(@InjectRepository(Cat) private readonly repo: Repository<Cat>) {}
  findAll() { return this.repo.find(); }
}
```

## Rules
- Entities hold shape, not behaviour — query logic goes in services/custom repositories.
- Use the query builder or `find` options; parameterise any raw SQL.
- Schema changes go through migrations (`typeorm migration:generate`). Never run `synchronize: true` in production.
- Select only needed columns and paginate large reads.

## Ground yourself
Use `module_graph` to confirm which module registers a given entity's repository before injecting it elsewhere.
