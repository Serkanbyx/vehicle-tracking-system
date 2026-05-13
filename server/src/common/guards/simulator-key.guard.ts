import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "../utils/timing-safe-equal.js";

@Injectable()
export class SimulatorKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers["x-simulator-key"] as string | undefined;
    const expected = this.configService.get<string>("SIMULATOR_API_KEY");

    if (!provided || !expected || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
