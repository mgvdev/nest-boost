import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index(): string {
    return this.appService.hello();
  }

  @Get("health")
  health(): { status: string } {
    return { status: "ok" };
  }
}
