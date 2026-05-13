import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Location } from "./location.entity.js";

const DEFAULT_HISTORY_LIMIT = 5000;
const MAX_HISTORY_LIMIT = 20_000;
const MAX_LATEST_COUNT = 500;
const HEATMAP_DOWNSAMPLE_THRESHOLD = 20_000;
const HEATMAP_MAX_POINTS = 50_000;

interface PersistPayload {
  lng: number;
  lat: number;
  speed: number;
  heading?: number | null;
  altitude?: number | null;
  accuracy?: number | null;
  source?: "device" | "simulator" | "manual";
  timestamp?: Date;
}

interface HistoryQuery {
  from?: Date;
  to?: Date;
  limit?: number;
  minSpeed?: number;
  maxSpeed?: number;
}

interface StatsQuery {
  from?: Date;
  to?: Date;
}

export interface LocationPoint {
  id: string;
  vehicleId: string;
  lng: number;
  lat: number;
  speed: number;
  heading: number | null;
  altitude: number | null;
  accuracy: number | null;
  source: string;
  timestamp: Date;
}

export interface LocationStats {
  pointCount: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  distanceKm: number;
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
  ) {}

  async persist(vehicleId: string, payload: PersistPayload): Promise<void> {
    await this.locationsRepo.query(
      `INSERT INTO "location" ("vehicleId", "geom", "speed", "heading", "altitude", "accuracy", "source", "timestamp")
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9)`,
      [
        vehicleId,
        payload.lng,
        payload.lat,
        payload.speed,
        payload.heading ?? null,
        payload.altitude ?? null,
        payload.accuracy ?? null,
        payload.source ?? "device",
        payload.timestamp ?? new Date(),
      ],
    );
  }

  async getHistory(
    vehicleId: string,
    query: HistoryQuery = {},
  ): Promise<LocationPoint[]> {
    const now = new Date();
    const from = query.from ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to = query.to ?? now;
    const limit = Math.min(query.limit ?? DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);
    const minSpeed = query.minSpeed ?? 0;
    const maxSpeed = query.maxSpeed ?? 400;

    const rows = await this.locationsRepo.query(
      `SELECT
        "id",
        "vehicleId",
        ST_X("geom")::float AS "lng",
        ST_Y("geom")::float AS "lat",
        "speed"::float,
        "heading",
        "altitude"::float,
        "accuracy"::float,
        "source",
        "timestamp"
      FROM "location"
      WHERE "vehicleId" = $1
        AND "timestamp" BETWEEN $2 AND $3
        AND "speed" BETWEEN $4 AND $5
      ORDER BY "timestamp" ASC
      LIMIT $6`,
      [vehicleId, from, to, minSpeed, maxSpeed, limit],
    );

    return rows;
  }

  async getLatest(
    vehicleId: string,
    count: number = 10,
  ): Promise<LocationPoint[]> {
    const clampedCount = Math.min(count, MAX_LATEST_COUNT);

    const rows = await this.locationsRepo.query(
      `SELECT
        "id",
        "vehicleId",
        ST_X("geom")::float AS "lng",
        ST_Y("geom")::float AS "lat",
        "speed"::float,
        "heading",
        "altitude"::float,
        "accuracy"::float,
        "source",
        "timestamp"
      FROM "location"
      WHERE "vehicleId" = $1
      ORDER BY "timestamp" DESC
      LIMIT $2`,
      [vehicleId, clampedCount],
    );

    return rows;
  }

  async getStats(
    vehicleId: string,
    query: StatsQuery = {},
  ): Promise<LocationStats> {
    const now = new Date();
    const from = query.from ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to = query.to ?? now;

    const [row] = await this.locationsRepo.query(
      `SELECT
        COUNT(*)::int                                                    AS "pointCount",
        COALESCE(ROUND(AVG("speed")::numeric, 2)::float, 0)             AS "avgSpeedKmh",
        COALESCE(ROUND(MAX("speed")::numeric, 2)::float, 0)             AS "maxSpeedKmh",
        COALESCE(
          ST_Length(ST_MakeLine("geom" ORDER BY "timestamp")::geography) / 1000,
          0
        )::float                                                         AS "distanceKm"
      FROM "location"
      WHERE "vehicleId" = $1 AND "timestamp" BETWEEN $2 AND $3`,
      [vehicleId, from, to],
    );

    return {
      pointCount: row.pointCount ?? 0,
      avgSpeedKmh: row.avgSpeedKmh ?? 0,
      maxSpeedKmh: row.maxSpeedKmh ?? 0,
      distanceKm: row.distanceKm ?? 0,
    };
  }

  async getHeatmap(
    vehicleId: string,
    from: Date,
    to: Date,
  ): Promise<{ points: [number, number, number][]; total: number; downsampled: boolean }> {
    const [countRow] = await this.locationsRepo.query(
      `SELECT COUNT(*)::int AS total
       FROM "location"
       WHERE "vehicleId" = $1 AND "timestamp" BETWEEN $2 AND $3`,
      [vehicleId, from, to],
    );

    const total: number = countRow?.total ?? 0;

    if (total > HEATMAP_DOWNSAMPLE_THRESHOLD) {
      const rows = await this.locationsRepo.query(
        `SELECT
          ROUND(ST_X("geom")::numeric, 4)::float AS lng,
          ROUND(ST_Y("geom")::numeric, 4)::float AS lat,
          COUNT(*)::int                           AS intensity
        FROM "location"
        WHERE "vehicleId" = $1 AND "timestamp" BETWEEN $2 AND $3
        GROUP BY 1, 2
        ORDER BY intensity DESC
        LIMIT $4`,
        [vehicleId, from, to, HEATMAP_MAX_POINTS],
      );

      const points = rows.map((r: { lng: number; lat: number; intensity: number }) =>
        [r.lng, r.lat, r.intensity] as [number, number, number],
      );

      return { points, total, downsampled: true };
    }

    const rows = await this.locationsRepo.query(
      `SELECT
        ST_X("geom")::float AS lng,
        ST_Y("geom")::float AS lat
      FROM "location"
      WHERE "vehicleId" = $1 AND "timestamp" BETWEEN $2 AND $3
      ORDER BY "timestamp" ASC`,
      [vehicleId, from, to],
    );

    const points = rows.map((r: { lng: number; lat: number }) =>
      [r.lng, r.lat, 1] as [number, number, number],
    );

    return { points, total, downsampled: false };
  }
}
