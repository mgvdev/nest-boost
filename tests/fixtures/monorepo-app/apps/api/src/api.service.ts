import { Injectable } from "@nestjs/common";
import { SharedService } from "../../../libs/shared/src";

@Injectable()
export class ApiService {
  constructor(private readonly shared: SharedService) {}

  users(): string[] {
    return ["ada", "alan"];
  }
}
