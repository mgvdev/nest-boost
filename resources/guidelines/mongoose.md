## Mongoose (@nestjs/mongoose)

- Connect with `MongooseModule.forRootAsync`; register schemas per feature with `MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])`.
- Define schemas with `@Schema()`/`@Prop()` decorators and export the `SchemaFactory.createForClass(Cat)`.
- Inject models: `constructor(@InjectModel(Cat.name) private readonly model: Model<CatDocument>) {}`.
- Keep query logic in services; use `lean()` for read-only queries and index frequently-queried fields.
