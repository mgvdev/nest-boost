import { CanActivate, Injectable } from "@nestjs/common";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
