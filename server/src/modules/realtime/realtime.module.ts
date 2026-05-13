import { Module } from "@nestjs/common";
import { RoomManager } from "./room-manager.service.js";

@Module({
  providers: [RoomManager],
  exports: [RoomManager],
})
export class RealtimeModule {}
