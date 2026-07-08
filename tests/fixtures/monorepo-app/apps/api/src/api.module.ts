import { Module } from "@nestjs/common";
import { SharedModule } from "../../../libs/shared/src";
import { ApiController } from "./api.controller";
import { ApiService } from "./api.service";
import { ApiKeyGuard } from "./api.guard";

@Module({
  imports: [SharedModule],
  controllers: [ApiController],
  providers: [ApiService, ApiKeyGuard],
})
export class ApiModule {}
