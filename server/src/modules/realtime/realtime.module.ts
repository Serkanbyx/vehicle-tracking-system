import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { AlertsModule } from "../alerts/alerts.module.js";
import { LocationsModule } from "../locations/locations.module.js";
import { VehiclesModule } from "../vehicles/vehicles.module.js";
import { DashboardGateway } from "./dashboard.gateway.js";
import { HeartbeatService } from "./heartbeat.service.js";
import { LocationIngestionService } from "./location-ingestion.service.js";
import { RoomManager } from "./room-manager.service.js";
import { StatusSweeperService } from "./status-sweeper.service.js";
import { VehiclesGateway } from "./vehicles.gateway.js";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => LocationsModule),
    forwardRef(() => AlertsModule),
    VehiclesModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_ACCESS_SECRET"),
      }),
    }),
  ],
  providers: [
    RoomManager,
    HeartbeatService,
    StatusSweeperService,
    LocationIngestionService,
    VehiclesGateway,
    DashboardGateway,
  ],
  exports: [RoomManager, HeartbeatService, LocationIngestionService],
})
export class RealtimeModule {}
