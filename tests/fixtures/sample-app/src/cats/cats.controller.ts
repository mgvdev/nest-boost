import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CatsService } from "./cats.service";
import { RolesGuard } from "./roles.guard";

@Controller("cats")
@UseGuards(RolesGuard)
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  findAll(): string[] {
    return this.catsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): string | undefined {
    return this.catsService.findOne(id);
  }

  @Post()
  create(@Body() body: unknown): unknown {
    return body;
  }
}
