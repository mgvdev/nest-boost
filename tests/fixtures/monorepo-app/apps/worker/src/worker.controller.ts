import { Controller, Post } from "@nestjs/common";
import { WorkerService } from "./worker.service";

@Controller("jobs")
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post("run")
  run(): string {
    return this.workerService.run();
  }
}
