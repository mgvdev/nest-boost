import { Injectable } from "@nestjs/common";

@Injectable()
export class SharedService {
  ping(): string {
    return "pong";
  }
}
