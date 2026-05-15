import { Injectable } from "@nestjs/common";
import WebSocket from "ws";

@Injectable()
export class RoomManager {
  private rooms = new Map<string, Set<WebSocket>>();
  private socketRooms = new WeakMap<WebSocket, Set<string>>();

  join(socket: WebSocket, room: string): void {
    let roomSet = this.rooms.get(room);
    if (!roomSet) {
      roomSet = new Set();
      this.rooms.set(room, roomSet);
    }
    roomSet.add(socket);

    let socketSet = this.socketRooms.get(socket);
    if (!socketSet) {
      socketSet = new Set();
      this.socketRooms.set(socket, socketSet);
    }
    socketSet.add(room);
  }

  leave(socket: WebSocket, room: string): void {
    const roomSet = this.rooms.get(room);
    if (roomSet) {
      roomSet.delete(socket);
      if (roomSet.size === 0) {
        this.rooms.delete(room);
      }
    }

    const socketSet = this.socketRooms.get(socket);
    if (socketSet) {
      socketSet.delete(room);
    }
  }

  leaveAll(socket: WebSocket): void {
    const socketSet = this.socketRooms.get(socket);
    if (!socketSet) return;

    for (const room of socketSet) {
      const roomSet = this.rooms.get(room);
      if (roomSet) {
        roomSet.delete(socket);
        if (roomSet.size === 0) {
          this.rooms.delete(room);
        }
      }
    }

    this.socketRooms.delete(socket);
  }

  broadcast(room: string, payload: unknown): void {
    const roomSet = this.rooms.get(room);
    if (!roomSet) return;

    const data = JSON.stringify(payload);

    for (const socket of roomSet) {
      if (socket.readyState !== WebSocket.OPEN) {
        roomSet.delete(socket);
        continue;
      }
      this.safeSend(socket, data);
    }

    if (roomSet.size === 0) {
      this.rooms.delete(room);
    }
  }

  broadcastToMany(rooms: string[], payload: unknown): void {
    const seen = new Set<WebSocket>();
    const data = JSON.stringify(payload);

    for (const room of rooms) {
      const roomSet = this.rooms.get(room);
      if (!roomSet) continue;

      for (const socket of roomSet) {
        if (socket.readyState !== WebSocket.OPEN) {
          roomSet.delete(socket);
          continue;
        }
        if (!seen.has(socket)) {
          seen.add(socket);
          this.safeSend(socket, data);
        }
      }
    }
  }

  count(room: string): number {
    return this.rooms.get(room)?.size ?? 0;
  }

  private safeSend(socket: WebSocket, data: string): void {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    } catch {
      // drop silently, socket will be cleaned on next broadcast
    }
  }
}
