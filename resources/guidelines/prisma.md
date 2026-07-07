## Prisma

- Wrap the client in a `PrismaService extends PrismaClient` that connects in `onModuleInit`; export it from a `PrismaModule`.
- Inject `PrismaService` into feature services; never instantiate `new PrismaClient()` per request.
- Keep the schema in `schema.prisma`; run `prisma migrate dev` for changes and `prisma generate` after editing models.
- Select only needed fields (`select`/`include`) and paginate with `take`/`cursor`.
- Handle known errors via `Prisma.PrismaClientKnownRequestError` and map them to `HttpException`s.
