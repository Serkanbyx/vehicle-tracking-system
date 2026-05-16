import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { AlertEngineService } from "../alerts/alert-engine.service.js";
import { LocationsService } from "../locations/locations.service.js";
import { TripAggregatorService } from "../trips/trip-aggregator.service.js";
import type { VehicleLastLocation } from "../vehicles/vehicle.entity.js";
import { Vehicle } from "../vehicles/vehicle.entity.js";
import { RoomManager } from "./room-manager.service.js";

const MOVING_SPEED_THRESHOLD = 5;

export interface IngestPayload {
  vehicleId: string;
  lng: number;
  lat: number;
  speed: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  source?: "device" | "simulator" | "manual";
  timestamp?: Date;
}

@Injectable()
export class LocationIngestionService {
  private readonly logger = new Logger(LocationIngestionService.name);
  private readonly idleThresholdMs: number;
  private readonly plateCache = new Map<string, string>();

  constructor(
    private readonly locationsService: LocationsService,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    private readonly roomManager: RoomManager,
    configService: ConfigService,
    private readonly alertEngine: AlertEngineService,
    private readonly tripAggregator: TripAggregatorService,
  ) {
    const idleMin = configService.get<number>("app.idleThresholdMin") ?? 10;
    this.idleThresholdMs = idleMin * 60 * 1000;
  }

  async handle(payload: IngestPayload): Promise<void> {
    const vehicleId = payload.vehicleId;
    const now = payload.timestamp ?? new Date();
    const ts = now instanceof Date ? now.toISOString() : now;

    const vehicle = await this.vehiclesRepo.findOne({
      where: { id: vehicleId },
      select: ["id", "plate", "lastLocation", "speedLimitKmh"],
    });

    if (!vehicle) {
      this.logger.warn(`Vehicle not found: ${vehicleId}`);
      return;
    }

    await this.locationsService.persist(vehicleId, {
      lng: payload.lng,
      lat: payload.lat,
      speed: payload.speed,
      heading: payload.heading,
      altitude: payload.altitude,
      accuracy: payload.accuracy,
      source: payload.source ?? "device",
      timestamp: now,
    });

    const status = this.computeStatus(payload.speed, vehicle.lastLocation);

    const newLocation: VehicleLastLocation = {
      lng: payload.lng,
      lat: payload.lat,
      speed: payload.speed,
      heading: payload.heading ?? 0,
      timestamp: ts,
      status,
    };

    await this.vehiclesRepo.update(vehicleId, {
      lastLocation: newLocation,
    });

    const prevPoint = vehicle.lastLocation
      ? {
          lng: vehicle.lastLocation.lng,
          lat: vehicle.lastLocation.lat,
          speed: vehicle.lastLocation.speed,
        }
      : null;
    const nextPoint = { lng: payload.lng, lat: payload.lat, speed: payload.speed };

    this.alertEngine
      .run(vehicle, prevPoint, nextPoint)
      .catch((err) => this.logger.error("AlertEngine error", err));

    this.tripAggregator
      .tick(vehicle, status, nextPoint)
      .catch((err) => this.logger.error("TripAggregator error", err));

    const broadcastPayload = {
      type: "vehicle:update",
      vehicleId,
      plate: vehicle.plate,
      coordinates: [payload.lng, payload.lat],
      speed: payload.speed,
      heading: payload.heading ?? 0,
      timestamp: ts,
      status,
    };

    this.roomManager.broadcastToMany(
      [`vehicle:${vehicleId}`, "role:viewer", "role:manager", "role:admin"],
      broadcastPayload,
    );
  }

  async resolveVehicleId(plateOrId: string): Promise<string | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(plateOrId)) {
      return plateOrId;
    }

    const cached = this.plateCache.get(plateOrId.toUpperCase());
    if (cached) return cached;

    const vehicle = await this.vehiclesRepo.findOne({
      where: { plate: plateOrId.toUpperCase() },
      select: ["id", "plate"],
    });

    if (!vehicle) return null;

    this.plateCache.set(vehicle.plate, vehicle.id);
    return vehicle.id;
  }

  invalidatePlateCache(plate?: string): void {
    if (plate) {
      this.plateCache.delete(plate.toUpperCase());
    } else {
      this.plateCache.clear();
    }
  }

  private computeStatus(
    speed: number,
    prevLocation: VehicleLastLocation | null,
  ): "moving" | "idle" | "offline" {
    if (speed >= MOVING_SPEED_THRESHOLD) {
      return "moving";
    }

    if (!prevLocation?.timestamp) {
      return "idle";
    }

    const lastTs = new Date(prevLocation.timestamp).getTime();
    const elapsed = Date.now() - lastTs;

    if (elapsed <= this.idleThresholdMs) {
      return "idle";
    }

    return "offline";
  }
}
