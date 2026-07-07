## Architecture: CQRS (@nestjs/cqrs)

This project separates writes (commands) from reads (queries) using `@nestjs/cqrs`.
Register `CqrsModule` in each feature module.

```
src/
  <feature>/
    commands/
      impl/<name>.command.ts       # data class
      handlers/<name>.handler.ts    # @CommandHandler
    queries/
      impl/<name>.query.ts
      handlers/<name>.handler.ts    # @QueryHandler
    events/
      impl/<name>.event.ts
      handlers/<name>.handler.ts    # @EventsHandler
    <feature>.controller.ts         # dispatches via CommandBus/QueryBus
    <feature>.module.ts
```

Rules:
- Controllers/resolvers do **not** call services directly — they dispatch a
  Command or Query: `this.commandBus.execute(new CreateCatCommand(dto))`.
- One handler per command/query. Commands mutate state; queries are side-effect free.
- Emit domain events from aggregates (`AggregateRoot.apply(new CatCreatedEvent())`)
  and handle side effects in `@EventsHandler`s.
- Cross-aggregate workflows go in **Sagas**, not inside handlers.
- Keep command/query objects as plain data; put logic in handlers.
