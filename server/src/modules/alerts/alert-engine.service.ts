import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { AlertSeverity, AlertType } from "../../common/enums/alert.enum.js";
import { GeofenceDirection } from "../../common/enums/geofence.enum.js";
import { GeofencesService } from "../geofences/geofences.service.js";
import { RoomManager } from "../realtime/room-manager.service.js";
import type { Vehicle } from "../vehicles/vehicle.entity.js";
import { Alert } from "./alert.entity.js";

interface Coords {
  lng: number;
  lat: number;
}

interface LocationPoint extends Coords {
  speed: number;
}

const SPEED_DEBOUNCE_SEC = 60;
const CRITICAL_OVER_LIMIT = 30;

@Injectable()
export class AlertEngineService {
  private readonly defaultSpeedLimit: number;

  constructor(
    @InjectRepository(Alert)
    private readonly alertsRepo: Repository<Alert>,
    private readonly geofencesService: GeofencesService,
    private readonly roomManager: RoomManager,
    configService: ConfigService,
  ) {
    this.defaultSpeedLimit = configService.get<number>("app.speedLimitKmh") ?? 90;
  }

  async run(
    vehicle: Pick<Vehicle, "id" | "speedLimitKmh">,
    prev: LocationPoint | null,
    next: LocationPoint,
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const speedAlert = await this.checkSpeed(vehicle, next);
    if (speedAlert) alerts.push(speedAlert);

    const geofenceAlerts = await this.checkGeofences(vehicle.id, prev, next);
    alerts.push(...geofenceAlerts);

    return alerts;
  }

  private async checkSpeed(
    vehicle: Pick<Vehicle, "id" | "speedLimitKmh">,
    next: LocationPoint,
  ): Promise<Alert | null> {
    const limit = vehicle.speedLimitKmh ?? this.defaultSpeedLimit;

    if (next.speed <= limit) return null;

    const recent = await this.alertsRepo
      .createQueryBuilder("a")
      .where("a.vehicleId = :vehicleId", { vehicleId: vehicle.id })
      .andWhere("a.type = :type", { type: AlertType.SPEED })
      .andWhere("a.createdAt > NOW() - :sec * INTERVAL '1 second'", {
        sec: SPEED_DEBOUNCE_SEC,
      })
      .limit(1)
      .getOne();

    if (recent) return null;

    const over = next.speed - limit;
    const severity = over >= CRITICAL_OVER_LIMIT ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;

    const alert = await this.persistAlert({
      vehicleId: vehicle.id,
      type: AlertType.SPEED,
      severity,
      message: `Speed ${next.speed} km/h exceeds limit ${limit} km/h by ${over.toFixed(0)} km/h`,
      lng: next.lng,
      lat: next.lat,
      speed: next.speed,
    });

    return alert;
  }

  private async checkGeofences(
    vehicleId: string,
    prev: LocationPoint | null,
    next: LocationPoint,
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const prevContaining = prev ? await this.geofencesService.findContaining(vehicleId, prev) : [];

    const nextContaining = await this.geofencesService.findContaining(vehicleId, next);

    const prevIds = new Set(prevContaining.map((g) => g.id));
    const nextIds = new Set(nextContaining.map((g) => g.id));

    const entered = nextContaining.filter((g) => !prevIds.has(g.id));
    const exited = prevContaining.filter((g) => !nextIds.has(g.id));

    for (const geofence of entered) {
      if (
        geofence.direction === GeofenceDirection.ENTER ||
        geofence.direction === GeofenceDirection.BOTH
      ) {
        const alert = await this.persistAlert({
          vehicleId,
          type: AlertType.GEOFENCE_ENTER,
          severity: AlertSeverity.WARNING,
          message: `Vehicle entered geofence "${geofence.name}"`,
          lng: next.lng,
          lat: next.lat,
          geofenceId: geofence.id,
        });
        alerts.push(alert);
      }
    }

    for (const geofence of exited) {
      if (
        geofence.direction === GeofenceDirection.EXIT ||
        geofence.direction === GeofenceDirection.BOTH
      ) {
        const alert = await this.persistAlert({
          vehicleId,
          type: AlertType.GEOFENCE_EXIT,
          severity: AlertSeverity.WARNING,
          message: `Vehicle exited geofence "${geofence.name}"`,
          lng: next.lng,
          lat: next.lat,
          geofenceId: geofence.id,
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private async persistAlert(data: {
    vehicleId: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    lng: number;
    lat: number;
    speed?: number;
    geofenceId?: string;
  }): Promise<Alert> {
    const result = await this.alertsRepo.query(
      `INSERT INTO alert ("vehicleId", "type", "severity", "message", "geom", "speed", "geofenceId")
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8)
       RETURNING *`,
      [
        data.vehicleId,
        data.type,
        data.severity,
        data.message,
        data.lng,
        data.lat,
        data.speed ?? null,
        data.geofenceId ?? null,
      ],
    );

    const alert = result[0] as Alert;

    this.broadcastAlert(data.vehicleId, alert);

    return alert;
  }

  async createIdleAlert(vehicle: {
    id: string;
    lastLocation: { lng: number; lat: number } | null;
  }): Promise<Alert> {
    const lng = vehicle.lastLocation?.lng ?? 0;
    const lat = vehicle.lastLocation?.lat ?? 0;

    return this.persistAlert({
      vehicleId: vehicle.id,
      type: AlertType.IDLE,
      severity: AlertSeverity.INFO,
      message: "Vehicle has been idle beyond threshold",
      lng,
      lat,
    });
  }

  private broadcastAlert(vehicleId: string, alert: Alert): void {
    this.roomManager.broadcastToMany([`vehicle:${vehicleId}`, "role:manager", "role:admin"], {
      type: "alert:new",
      alert,
    });
  }
}
