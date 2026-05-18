import type { IncomingMessage } from "node:http";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import type WebSocket from "ws";
import type { Server } from "ws";
import { timingSafeEqual } from "../../common/utils/timing-safe-equal.js";
import { LocationUpdatePayloadDto } from "./dto/location-update.dto.js";
import { HeartbeatService } from "./heartbeat.service.js";
import { LocationIngestionService } from "./location-ingestion.service.js";
import { RoomManager } from "./room-manager.service.js";

const MAX_EVENTS_PER_SECOND = 5;

interface RateEntry {
  count: number;
  resetAt: number;
}

interface DeviceSocket extends WebSocket {
  deviceId: string;
}

@WebSocketGateway({ path: "/ws/vehicles" })
export class VehiclesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(VehiclesGateway.name);
  private readonly rateCounters = new WeakMap<WebSocket, RateEntry>();
  private readonly simulatorKey: string;

  private readonly clientUrl: string;

  constructor(
    configService: ConfigService,
    private readonly roomManager: RoomManager,
    private readonly heartbeatService: HeartbeatService,
    private readonly ingestionService: LocationIngestionService,
  ) {
    this.simulatorKey = configService.get<string>("SIMULATOR_API_KEY") ?? "";
    this.clientUrl = configService.get<string>("CLIENT_URL") ?? "http://localhost:3000";
  }

  handleConnection(socket: WebSocket, req: IncomingMessage): void {
    const origin = req.headers.origin;
    if (origin && origin !== this.clientUrl) {
      socket.close(4003, "Forbidden origin");
      return;
    }

    const provided = req.headers["x-simulator-key"] as string | undefined;

    if (!provided || !timingSafeEqual(provided, this.simulatorKey)) {
      socket.close(4001, "Unauthorized");
      return;
    }

    const deviceSocket = socket as DeviceSocket;
    deviceSocket.deviceId = (req.headers["x-device-id"] as string) || "unknown";

    this.heartbeatService.register(socket);
  }

  handleDisconnect(socket: WebSocket): void {
    this.heartbeatService.unregister(socket);
    this.roomManager.leaveAll(socket);
  }

  @SubscribeMessage("location_update")
  async handleLocationUpdate(client: WebSocket, data: unknown): Promise<void> {
    if (!this.allowEvent(client)) {
      this.logger.warn("Rate limit exceeded for device socket");
      return;
    }

    const dto = plainToInstance(LocationUpdatePayloadDto, data);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const errorMsg = JSON.stringify({
        event: "error",
        data: { message: "Invalid payload" },
      });
      client.send(errorMsg);
      return;
    }

    await this.ingestionService.handle({
      vehicleId: dto.vehicleId,
      lng: dto.lng,
      lat: dto.lat,
      speed: dto.speed,
      heading: dto.heading,
      altitude: dto.altitude,
      accuracy: dto.accuracy,
      source: "simulator",
      timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
    });
  }

  private allowEvent(socket: WebSocket): boolean {
    const now = Date.now();
    let entry = this.rateCounters.get(socket);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + 1000 };
      this.rateCounters.set(socket, entry);
    }

    if (entry.count >= MAX_EVENTS_PER_SECOND) {
      return false;
    }

    entry.count++;
    return true;
  }
}
