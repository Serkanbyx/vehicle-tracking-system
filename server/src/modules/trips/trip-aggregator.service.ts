import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TripStatus } from "../../common/enums/trip.enum.js";
import { Trip } from "./trip.entity.js";

@Injectable()
export class TripAggregatorService {
  private readonly logger = new Logger(TripAggregatorService.name);
  private readonly tripEndMs: number;

  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepo: Repository<Trip>,
    private readonly configService: ConfigService,
  ) {
    const tripEndMin = configService.get<number>("app.tripEndMin") ?? 5;
    this.tripEndMs = tripEndMin * 60 * 1000;
  }

  async tick(
    vehicle: { id: string },
    status: "moving" | "idle" | "offline",
    point: { lng: number; lat: number; speed: number },
  ): Promise<void> {
    const openTrip = await this.tripsRepo.findOne({
      where: { vehicleId: vehicle.id, status: TripStatus.OPEN },
      order: { startedAt: "DESC" },
    });

    if (status === "moving" && !openTrip) {
      await this.tripsRepo.query(
        `INSERT INTO trip ("vehicleId", "startedAt", "startGeom", "pointCount", "maxSpeedKmh", "status")
         VALUES ($1, NOW(), ST_SetSRID(ST_MakePoint($2, $3), 4326), 1, $4, 'open')`,
        [vehicle.id, point.lng, point.lat, point.speed],
      );
      return;
    }

    if (openTrip) {
      const newMax =
        openTrip.maxSpeedKmh !== null && point.speed > Number(openTrip.maxSpeedKmh)
          ? point.speed
          : openTrip.maxSpeedKmh;

      await this.tripsRepo
        .createQueryBuilder()
        .update(Trip)
        .set({
          pointCount: () => '"pointCount" + 1',
          maxSpeedKmh: newMax,
        })
        .where("id = :id", { id: openTrip.id })
        .execute();
    }
  }

  @Cron("*/60 * * * * *")
  async tryCloseIdleTrips(): Promise<void> {
    const openTrips = await this.tripsRepo.find({
      where: { status: TripStatus.OPEN },
    });

    for (const trip of openTrips) {
      const idleSince = await this.getVehicleIdleSince(trip.vehicleId);

      if (!idleSince || Date.now() - idleSince.getTime() < this.tripEndMs) {
        continue;
      }

      await this.closeTrip(trip.id, trip.vehicleId, trip.startedAt);
    }
  }

  private async getVehicleIdleSince(
    vehicleId: string,
  ): Promise<Date | null> {
    const result = await this.tripsRepo.query(
      `SELECT ("lastLocation"->>'timestamp')::timestamptz AS ts,
              "lastLocation"->>'status' AS status
       FROM vehicle WHERE id = $1`,
      [vehicleId],
    );

    const row = result[0];
    if (!row || (row.status !== "idle" && row.status !== "offline")) {
      return null;
    }

    return row.ts ? new Date(row.ts) : null;
  }

  private async closeTrip(
    tripId: string,
    vehicleId: string,
    startedAt: Date,
  ): Promise<void> {
    await this.tripsRepo.query(
      `WITH closing AS (
        SELECT
          t.id,
          (SELECT MAX("timestamp")
           FROM location
           WHERE "vehicleId" = t."vehicleId"
             AND "timestamp" > t."startedAt")                                           AS ended_at,
          (SELECT ST_Length(ST_MakeLine("geom" ORDER BY "timestamp")::geography) / 1000
           FROM location
           WHERE "vehicleId" = t."vehicleId"
             AND "timestamp" BETWEEN t."startedAt" AND NOW())                           AS distance_km,
          (SELECT ROUND(AVG("speed")::numeric, 2)
           FROM location
           WHERE "vehicleId" = t."vehicleId"
             AND "timestamp" BETWEEN t."startedAt" AND NOW())                           AS avg_speed,
          (SELECT ROUND(MAX("speed")::numeric, 2)
           FROM location
           WHERE "vehicleId" = t."vehicleId"
             AND "timestamp" BETWEEN t."startedAt" AND NOW())                           AS max_speed,
          (SELECT ST_SetSRID(ST_MakePoint(
            ST_X((SELECT "geom" FROM location WHERE "vehicleId" = t."vehicleId" ORDER BY "timestamp" DESC LIMIT 1)),
            ST_Y((SELECT "geom" FROM location WHERE "vehicleId" = t."vehicleId" ORDER BY "timestamp" DESC LIMIT 1))
          ), 4326))                                                                     AS end_geom,
          (SELECT COUNT(*)::int FROM alert
           WHERE "vehicleId" = t."vehicleId" AND type = 'speed'
             AND "createdAt" BETWEEN t."startedAt" AND NOW())                           AS sv,
          (SELECT COUNT(*)::int FROM alert
           WHERE "vehicleId" = t."vehicleId" AND type = 'idle'
             AND "createdAt" BETWEEN t."startedAt" AND NOW())                           AS ie,
          (SELECT COUNT(*)::int FROM alert
           WHERE "vehicleId" = t."vehicleId" AND type LIKE 'geofence_%'
             AND "createdAt" BETWEEN t."startedAt" AND NOW())                           AS ge
        FROM trip t
        WHERE t.id = $1
      )
      UPDATE trip
      SET "endedAt"          = c.ended_at,
          "endGeom"          = c.end_geom,
          "distanceKm"       = COALESCE(c.distance_km, 0),
          "avgSpeedKmh"      = COALESCE(c.avg_speed, 0),
          "maxSpeedKmh"      = COALESCE(c.max_speed, 0),
          "speedViolations"  = c.sv,
          "idleEvents"       = c.ie,
          "geofenceEvents"   = c.ge,
          "status"           = 'closed'
      FROM closing c
      WHERE trip.id = c.id
        AND trip.status = 'open'`,
      [tripId],
    );
  }
}
