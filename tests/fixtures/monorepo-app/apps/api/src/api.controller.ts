import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiService } from "./api.service";
import { ApiKeyGuard } from "./api.guard";

@Controller("users")
@UseGuards(ApiKeyGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  findAll(): string[] {
    return this.apiService.users();
  }

  @Get(":id")
  findOne(@Param("id") id: string): string | undefined {
    return this.apiService.users()[Number(id)];
  }
}
