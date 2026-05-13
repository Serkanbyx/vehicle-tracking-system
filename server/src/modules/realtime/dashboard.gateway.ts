import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { IncomingMessage } from "node:http";
import { Server } from "ws";
import WebSocket from "ws";
import type { UserRole } from "../../common/enums/user-role.enum.js";
import { HeartbeatService } from "./heartbeat.service.js";
import { RoomManager } from "./room-manager.service.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface DashboardSocket extends WebSocket {
  user: { id: string; role: UserRole; email: string };
}

@WebSocketGateway({ path: "/ws/dashboard" })
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(DashboardGateway.name);
  private readonly accessSecret: string;
  private readonly clientUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly roomManager: RoomManager,
    private readonly heartbeatService: HeartbeatService,
  ) {
    this.accessSecret =
      configService.get<string>("JWT_ACCESS_SECRET") ?? "";
    this.clientUrl =
      configService.get<string>("CLIENT_URL") ?? "http://localhost:3000";
  }

  async handleConnection(
    socket: WebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    try {
      const token = req.headers["sec-websocket-protocol"] as
        | string
        | undefined;

      if (!token) {
        socket.close(4001, "Unauthorized");
        return;
      }

      const origin = req.headers.origin;
      if (origin && origin !== this.clientUrl) {
        socket.close(4003, "Forbidden origin");
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: UserRole;
        email: string;
      }>(token, { secret: this.accessSecret });

      const ds = socket as DashboardSocket;
      ds.user = { id: payload.sub, role: payload.role, email: payload.email };

      this.roomManager.join(socket, `role:${ds.user.role}`);
      this.heartbeatService.register(socket);
    } catch {
      socket.close(4001, "Unauthorized");
    }
  }

  handleDisconnect(socket: WebSocket): void {
    this.heartbeatService.unregister(socket);
    this.roomManager.leaveAll(socket);
  }

  @SubscribeMessage("subscribe")
  handleSubscribe(
    client: WebSocket,
    data: { vehicleId?: string },
  ): void {
    if (!data?.vehicleId || !UUID_REGEX.test(data.vehicleId)) {
      client.send(
        JSON.stringify({
          event: "error",
          data: { message: "Invalid vehicleId" },
        }),
      );
      return;
    }

    this.roomManager.join(client, `vehicle:${data.vehicleId}`);
  }

  @SubscribeMessage("unsubscribe")
  handleUnsubscribe(
    client: WebSocket,
    data: { vehicleId?: string },
  ): void {
    if (!data?.vehicleId || !UUID_REGEX.test(data.vehicleId)) {
      return;
    }

    this.roomManager.leave(client, `vehicle:${data.vehicleId}`);
  }
}
