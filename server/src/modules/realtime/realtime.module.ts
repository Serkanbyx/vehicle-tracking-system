import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { LocationsModule } from "../locations/locations.module.js";
import { DashboardGateway } from "./dashboard.gateway.js";
import { HeartbeatService } from "./heartbeat.service.js";
import { RoomManager } from "./room-manager.service.js";
import { VehiclesGateway } from "./vehicles.gateway.js";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LocationsModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_ACCESS_SECRET"),
      }),
    }),
  ],
  providers: [RoomManager, HeartbeatService, VehiclesGateway, DashboardGateway],
  exports: [RoomManager, HeartbeatService],
})
export class RealtimeModule {}
