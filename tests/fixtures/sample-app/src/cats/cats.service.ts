import { Injectable } from "@nestjs/common";

@Injectable()
export class CatsService {
  private readonly cats = ["Felix", "Garfield"];

  findAll(): string[] {
    return this.cats;
  }

  findOne(id: string): string | undefined {
    return this.cats[Number(id)];
  }
}
