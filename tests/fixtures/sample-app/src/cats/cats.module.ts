import { Module } from "@nestjs/common";
import { CatsController } from "./cats.controller";
import { CatsService } from "./cats.service";
import { RolesGuard } from "./roles.guard";

@Module({
  controllers: [CatsController],
  providers: [CatsService, RolesGuard],
  exports: [CatsService],
})
export class CatsModule {}
