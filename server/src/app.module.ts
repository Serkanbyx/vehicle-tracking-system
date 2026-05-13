import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { appConfig } from "./config/app.config";
import { validate } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [".env.local", ".env"],
      cache: true,
      load: [appConfig],
    }),

    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 100 },
      { name: "auth", ttl: 900_000, limit: 10 },
      { name: "upload", ttl: 3_600_000, limit: 30 },
      { name: "export", ttl: 900_000, limit: 20 },
      { name: "admin", ttl: 300_000, limit: 60 },
    ]),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
