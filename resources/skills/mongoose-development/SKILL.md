---
name: mongoose-development
description: Build the persistence layer with Mongoose in NestJS — schemas, model injection, relations/populate, transactions, and lean reads. Use when modeling data or querying MongoDB with @nestjs/mongoose.
---

# Mongoose in NestJS

## When to use this skill
Use when adding schemas, models, or MongoDB queries with `@nestjs/mongoose` + `mongoose`.

## Install
`bun add @nestjs/mongoose mongoose`.

## Wire it up
```ts
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (c: ConfigService) => ({ uri: c.get('MONGODB_URI') }),
})
```

Per feature, register the schema — this provides the injectable model:
```ts
@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  providers: [CatsService],
})
export class CatsModule {}
```

## Schema + model
Define schemas with decorators and export the compiled schema + a document type:
```ts
export type CatDocument = HydratedDocument<Cat>;

@Schema({ timestamps: true })
export class Cat {
  @Prop({ required: true }) name: string;
  @Prop({ index: true }) breed: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Owner' }) owner: Owner;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

Inject the model:
```ts
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private readonly catModel: Model<Cat>) {}
  findAll() { return this.catModel.find().lean().exec(); }
}
```

## Relations
- Reference other documents with `{ type: ObjectId, ref: 'Owner' }` and load them with
  `.populate('owner')`. Populate only what you need — it's an extra query.
- Embed subdocuments when they're owned by and read with the parent; reference when shared or large.

## Transactions
Use a session (requires a replica set):
```ts
constructor(@InjectConnection() private readonly connection: Connection) {}

const session = await this.connection.startSession();
try {
  await session.withTransaction(async () => {
    await this.catModel.create([{ name: 'Felix' }], { session });
  });
} finally {
  await session.endSession();
}
```

## Rules
- Schemas own shape + indexes; business logic goes in services.
- Use `.lean()` for read-only queries (returns plain objects, much faster — no getters/setters/virtuals).
- Add indexes (`@Prop({ index: true })`, `@Schema` compound indexes) for every queried field; MongoDB won't warn you about missing ones.
- Validate at the schema level (`required`, `min`, `enum`) and/or with `class-validator` DTOs at the controller.
- Paginate large reads (`limit`/`skip` or range queries on an indexed field); avoid unbounded `find()`.
- Never build queries from unsanitized user objects (operator injection) — validate DTOs first.

## Testing
Provide a mocked model via its token:
```ts
{ provide: getModelToken(Cat.name), useValue: mockModel }
```

## Ground yourself
Use the `nest-boost` `db_schema` tool to list the real collections + sampled fields and
`db_query` (`collection` + `filter`) to sample documents read-only. Use `module_graph` to
confirm which module registers a model with `forFeature` before injecting it.
