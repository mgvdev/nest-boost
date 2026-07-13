import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CatsService } from "./cats.service";
import { RolesGuard } from "./roles.guard";

const createCatSchema = z.object({
  name: z.string().min(1),
});

@Controller("cats")
@UseGuards(RolesGuard)
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  findAll(): string[] {
    return this.catsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", { schema: z.coerce.number().int().positive() }) id: number): string | undefined {
    return this.catsService.findOne(String(id));
  }

  @Post()
  create(@Body({ schema: createCatSchema }) body: { name: string }): { name: string } {
    return body;
  }
}
