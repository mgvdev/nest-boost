import { Module } from "@nestjs/common";
import { MathService } from "./math.service";

@Module({
  providers: [
    MathService,
    { provide: "APP_CONFIG", useValue: { version: "1.2.3" } },
  ],
})
export class AppModule {}
