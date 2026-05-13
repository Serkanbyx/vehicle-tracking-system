import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { HealthController } from "./common/controllers/health.controller";
import { appConfig } from "./config/app.config";
import { databaseModule } from "./config/database.config";
import { validate } from "./config/env.validation";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [".env.local", ".env"],
      cache: true,
      load: [appConfig],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || "info",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true } },
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.currentPassword",
            "req.body.newPassword",
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        autoLogging: {
          ignore: (req) => (req as { url?: string }).url === "/api/health",
        },
      },
    }),

    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 100 },
      { name: "auth", ttl: 900_000, limit: 10 },
      { name: "upload", ttl: 3_600_000, limit: 30 },
      { name: "export", ttl: 900_000, limit: 20 },
      { name: "admin", ttl: 300_000, limit: 60 },
    ]),

    databaseModule,

    UsersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
