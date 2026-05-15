import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import type { TripExportQueryDto } from "./dto/trip-export-query.dto.js";
import type { TripQueryDto } from "./dto/trip-query.dto.js";
import type { TripSummaryQueryDto } from "./dto/trip-summary-query.dto.js";
import { Trip } from "./trip.entity.js";

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepo: Repository<Trip>,
  ) {}

  async findAll(query: TripQueryDto) {
    const qb = this.tripsRepo.createQueryBuilder("t");

    if (query.vehicleId) {
      qb.andWhere("t.vehicleId = :vehicleId", {
        vehicleId: query.vehicleId,
      });
    }

    if (query.status) {
      qb.andWhere("t.status = :status", { status: query.status });
    }

    if (query.from) {
      qb.andWhere("t.startedAt >= :from", { from: query.from });
    }

    if (query.to) {
      qb.andWhere("t.startedAt <= :to", { to: query.to });
    }

    qb.orderBy("t.startedAt", "DESC");

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripsRepo.findOne({ where: { id } });

    if (!trip) {
      throw new NotFoundException("Trip not found");
    }

    return trip;
  }

  async dailySummary(query: TripSummaryQueryDto) {
    const date = query.date ?? new Date().toISOString().slice(0, 10);
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const qb = this.tripsRepo
      .createQueryBuilder("t")
      .select([
        'COUNT(*)::int AS "tripCount"',
        'COALESCE(SUM("distanceKm")::float, 0) AS "totalDistanceKm"',
        'COALESCE(ROUND(AVG("avgSpeedKmh")::numeric, 2)::float, 0) AS "avgSpeed"',
        'COALESCE(MAX("maxSpeedKmh")::float, 0) AS "topSpeed"',
        'COALESCE(SUM("speedViolations")::int, 0) AS "speedViolations"',
        'COALESCE(SUM("idleEvents")::int, 0) AS "idleEvents"',
        'COALESCE(SUM("geofenceEvents")::int, 0) AS "geofenceEvents"',
      ])
      .where("t.startedAt BETWEEN :dayStart AND :dayEnd", {
        dayStart,
        dayEnd,
      });

    if (query.vehicleId) {
      qb.andWhere("t.vehicleId = :vehicleId", {
        vehicleId: query.vehicleId,
      });
    }

    const result = await qb.getRawOne();

    return { date, ...result };
  }

  async exportCsv(query: TripExportQueryDto): Promise<string> {
    const qb = this.tripsRepo.createQueryBuilder("t").leftJoinAndSelect("t.vehicle", "v");

    if (query.vehicleId) {
      qb.andWhere("t.vehicleId = :vehicleId", {
        vehicleId: query.vehicleId,
      });
    }

    if (query.from) {
      qb.andWhere("t.startedAt >= :from", { from: query.from });
    }

    if (query.to) {
      qb.andWhere("t.startedAt <= :to", { to: query.to });
    }

    qb.orderBy("t.startedAt", "DESC");

    const trips = await qb.getMany();

    const header =
      "id,vehicleId,plate,status,startedAt,endedAt,distanceKm,avgSpeedKmh,maxSpeedKmh,speedViolations,idleEvents,geofenceEvents,pointCount";

    const rows = trips.map((t) =>
      [
        t.id,
        t.vehicleId,
        t.vehicle?.plate ?? "",
        t.status,
        t.startedAt?.toISOString() ?? "",
        t.endedAt?.toISOString() ?? "",
        t.distanceKm ?? "",
        t.avgSpeedKmh ?? "",
        t.maxSpeedKmh ?? "",
        t.speedViolations,
        t.idleEvents,
        t.geofenceEvents,
        t.pointCount,
      ].join(","),
    );

    return [header, ...rows].join("\n");
  }
}
