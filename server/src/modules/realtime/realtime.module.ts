import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { LocationsModule } from "../locations/locations.module.js";
import { HeartbeatService } from "./heartbeat.service.js";
import { RoomManager } from "./room-manager.service.js";
import { VehiclesGateway } from "./vehicles.gateway.js";

@Module({
  imports: [ScheduleModule.forRoot(), LocationsModule],
  providers: [RoomManager, HeartbeatService, VehiclesGateway],
  exports: [RoomManager, HeartbeatService],
})
export class RealtimeModule {}
