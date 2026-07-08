import { Injectable } from "@nestjs/common";

@Injectable()
export class WorkerService {
  run(): string {
    return "working";
  }
}
