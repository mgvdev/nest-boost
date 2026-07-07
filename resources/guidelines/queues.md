## Queues (BullMQ / Bull)

- Register a queue with `BullModule.registerQueue({ name: 'emails' })` inside the owning module.
- Add jobs by injecting the queue: `@InjectQueue('emails') private readonly queue: Queue`.
- Process jobs in a `@Processor('emails')` provider with `@Process()`/`WorkerHost` handlers; keep handlers idempotent.
- Configure retries/backoff on job options, not by re-adding jobs manually.
- Put slow/external work (email, image processing, webhooks) on a queue instead of blocking the request.
