---
name: sequelize-development
description: Build the persistence layer with Sequelize in NestJS — models (sequelize-typescript), model injection, associations, and transactions. Use when modeling data or querying with @nestjs/sequelize.
---

# Sequelize in NestJS

## When to use this skill
Use when adding models, associations, or queries with `@nestjs/sequelize` +
`sequelize-typescript`.

## Install
`bun add @nestjs/sequelize sequelize sequelize-typescript pg pg-hstore` (swap the driver as needed).

## Wire it up
```ts
SequelizeModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (c: ConfigService) => ({
    dialect: 'postgres',
    uri: c.get('DATABASE_URL'),
    autoLoadModels: true,   // registers every forFeature() model
    synchronize: false,     // NEVER true outside local dev
  }),
})
```

Per feature: `SequelizeModule.forFeature([User])` provides the model for injection.

## Model + injection
```ts
import { Column, Model, Table, HasMany } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column firstName: string;
  @Column({ defaultValue: true }) isActive: boolean;
  @HasMany(() => Photo) photos: Photo[];
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}
  findAll() { return this.userModel.findAll({ include: [Photo] }); }
}
```

## Transactions
Inject the `Sequelize` instance and wrap the unit of work:

```ts
constructor(private readonly sequelize: Sequelize) {}

await this.sequelize.transaction(async (t) => {
  await this.userModel.create({ firstName: 'John' }, { transaction: t });
  await this.photoModel.create({ userId: 1 }, { transaction: t });
});
```

## Rules
- Models hold shape + associations; business logic goes in services.
- **`synchronize: true` is banned in production** — use `sequelize-cli` migrations to evolve schema.
- Load associations with `include` to avoid N+1; select attributes explicitly for wide tables.
- Paginate (`limit`/`offset`) and index frequently-queried columns.
- Never interpolate input into raw queries — use replacements/bind parameters.

## Testing
Provide a mocked model via its token:

```ts
{ provide: getModelToken(User), useValue: mockModel }
```

## Ground yourself
Use the `nest-boost` `module_graph` tool to confirm which module registers a model with
`forFeature` before injecting it.
