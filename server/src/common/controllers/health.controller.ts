import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  @SkipThrottle()
  check() {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
    };
  }
}
