import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SentryModule } from "@sentry/nestjs/setup";
import { LoggerModule } from "nestjs-pino";
import { HealthController } from "./common/controllers/health.controller";
import { WelcomeController } from "./common/controllers/welcome.controller";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { appConfig } from "./config/app.config";
import { databaseModule } from "./config/database.config";
import { validate } from "./config/env.validation";
import { jwtConfig } from "./config/jwt.config";
import { AdminModule } from "./modules/admin/admin.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { AuthModule } from "./modules/auth/auth.module";
import { GeofencesModule } from "./modules/geofences/geofences.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { TripsModule } from "./modules/trips/trips.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { UsersModule } from "./modules/users/users.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";

@Module({
  imports: [
    SentryModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [".env.local", ".env"],
      cache: true,
      load: [appConfig, jwtConfig],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || "info",
        transport:
          process.env.NODE_ENV === "production"
            ? {
                targets: [
                  {
                    target: "@logtail/pino",
                    options: { sourceToken: process.env.LOGTAIL_TOKEN },
                  },
                  { target: "pino/file", options: { destination: 1 } },
                ],
              }
            : { target: "pino-pretty", options: { singleLine: true } },
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.currentPassword",
            "req.body.newPassword",
            "req.body.refreshToken",
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        autoLogging: {
          ignore: (req) => {
            const url = (req as { url?: string }).url;
            return url === "/api/health" || (url?.startsWith("/ws/") ?? false);
          },
        },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return "error";
          if (res.statusCode >= 400) return "warn";
          return "info";
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
    AuthModule,
    VehiclesModule,
    LocationsModule,
    GeofencesModule,
    AlertsModule,
    TripsModule,
    AdminModule,
    UploadsModule,
    RealtimeModule,
  ],
  controllers: [HealthController, WelcomeController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
