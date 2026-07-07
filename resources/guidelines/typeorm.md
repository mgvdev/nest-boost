## TypeORM (@nestjs/typeorm)

- Configure the connection once with `TypeOrmModule.forRootAsync({ useFactory, inject: [ConfigService] })`.
- Register entities per feature with `TypeOrmModule.forFeature([Cat])` inside that feature's module; it provides the `Repository<Cat>` for injection.
- Inject repositories: `constructor(@InjectRepository(Cat) private readonly repo: Repository<Cat>) {}`.
- Keep entities free of business logic. Put query logic in the service or a custom repository.
- Use migrations (`typeorm migration:generate`) for schema changes; **never** ship `synchronize: true` to production.
- Prefer the query builder or `find` options over raw SQL; parameterise any raw query.
