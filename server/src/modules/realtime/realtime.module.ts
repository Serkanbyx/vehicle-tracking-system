import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { HeartbeatService } from "./heartbeat.service.js";
import { RoomManager } from "./room-manager.service.js";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RoomManager, HeartbeatService],
  exports: [RoomManager, HeartbeatService],
})
export class RealtimeModule {}
