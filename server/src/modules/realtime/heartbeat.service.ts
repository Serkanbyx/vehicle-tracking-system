import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import WebSocket from "ws";
import { RoomManager } from "./room-manager.service.js";

const HEARTBEAT_INTERVAL_MS = 30_000;

interface AliveSocket extends WebSocket {
  isAlive: boolean;
}

@Injectable()
export class HeartbeatService {
  private sockets = new Set<AliveSocket>();

  constructor(private readonly roomManager: RoomManager) {}

  register(socket: WebSocket): void {
    const s = socket as AliveSocket;
    s.isAlive = true;
    s.on("pong", () => {
      s.isAlive = true;
    });
    this.sockets.add(s);
  }

  unregister(socket: WebSocket): void {
    this.sockets.delete(socket as AliveSocket);
  }

  @Interval(HEARTBEAT_INTERVAL_MS)
  heartbeat(): void {
    for (const s of this.sockets) {
      if (!s.isAlive) {
        this.roomManager.leaveAll(s);
        this.sockets.delete(s);
        s.terminate();
        continue;
      }

      s.isAlive = false;
      s.ping();
    }
  }
}
