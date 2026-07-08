import { Injectable } from "@nestjs/common";

@Injectable()
export class MathService {
  add(a: number, b: number): number {
    return a + b;
  }

  async double(n: number): Promise<number> {
    return n * 2;
  }

  users(): { id: number; name: string }[] {
    return [
      { id: 1, name: "Ada" },
      { id: 2, name: "Alan" },
    ];
  }
}
