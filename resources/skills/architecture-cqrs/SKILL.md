---
name: architecture-cqrs
description: Build NestJS features with CQRS (@nestjs/cqrs) — commands, queries, events, their handlers, and sagas. Use when adding a write or read operation in a project that follows CQRS.
---

# CQRS Architecture (@nestjs/cqrs)

## When to use this skill
Use when adding an operation to a CQRS project: a write (command), a read (query),
a domain event, or a saga.

## Folder shape (per feature)
```
src/<feature>/
  commands/impl/*.command.ts        commands/handlers/*.handler.ts
  queries/impl/*.query.ts           queries/handlers/*.handler.ts
  events/impl/*.event.ts            events/handlers/*.handler.ts
  <feature>.controller.ts           <feature>.module.ts   # imports CqrsModule
```

## Add a write (command)
1. Command = plain data class: `class CreateCatCommand { constructor(public readonly dto: CreateCatDto) {} }`.
2. Handler:
```ts
@CommandHandler(CreateCatCommand)
export class CreateCatHandler implements ICommandHandler<CreateCatCommand> {
  async execute(cmd: CreateCatCommand) { /* mutate state, apply events */ }
}
```
3. Controller dispatches: `this.commandBus.execute(new CreateCatCommand(dto))`.
4. Register the handler in the module's `providers`.

## Add a read (query)
Same shape with `@QueryHandler` + `QueryBus`. Queries must be side-effect free.

## Events & sagas
- Aggregates extend `AggregateRoot` and `apply(new CatCreatedEvent(...))`.
- Side effects live in `@EventsHandler`s.
- Multi-step / cross-aggregate flows go in a `@Saga`, not inside a handler.

## Rules
- Controllers/resolvers never call services directly — always via CommandBus/QueryBus.
- One handler per command/query. Keep command/query objects logic-free.

## Ground yourself
Use `module_graph` to confirm handlers are registered in the right module and `CqrsModule` is imported.
