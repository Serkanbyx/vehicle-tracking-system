import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { DataSource, Repository } from "typeorm";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { escapeRegex } from "../../common/utils/escape-regex.js";
import { Alert } from "../alerts/alert.entity.js";
import { Trip } from "../trips/trip.entity.js";
import { User } from "../users/user.entity.js";
import { Vehicle } from "../vehicles/vehicle.entity.js";
import type { AdminUserQueryDto } from "./dto/admin-user-query.dto.js";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Alert)
    private readonly alertsRepo: Repository<Alert>,
    @InjectRepository(Trip)
    private readonly tripsRepo: Repository<Trip>,
    private readonly dataSource: DataSource,
  ) {}

  async getStats() {
    const [users, vehicles, alerts, trips, topViolators] = await Promise.all([
      this.getUserStats(),
      this.getVehicleStats(),
      this.getAlertStats(),
      this.getTripStats(),
      this.getTopViolators(),
    ]);

    return { users, vehicles, alerts, trips, topViolators };
  }

  async findUsers(query: AdminUserQueryDto) {
    const qb = this.usersRepo.createQueryBuilder("u");

    if (query.q) {
      const escaped = escapeRegex(query.q);
      qb.andWhere("(u.name ILIKE :q OR u.email ILIKE :q)", {
        q: `%${escaped}%`,
      });
    }

    if (query.role) {
      qb.andWhere("u.role = :role", { role: query.role });
    }

    if (query.isActive !== undefined) {
      qb.andWhere("u.isActive = :isActive", { isActive: query.isActive });
    }

    qb.orderBy("u.createdAt", "DESC");

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

  async findUserById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async setUserRole(targetId: string, newRole: UserRole, currentUserId: string): Promise<User> {
    this.assertNotSelf(targetId, currentUserId);

    return this.dataSource.transaction(async (trx) => {
      const target = await trx.findOne(User, { where: { id: targetId } });

      if (!target) {
        throw new NotFoundException("User not found");
      }

      if (target.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
        const adminCount = await trx.count(User, {
          where: { role: UserRole.ADMIN, isActive: true },
        });

        if (adminCount <= 1) {
          throw new BadRequestException("System must retain at least one admin");
        }
      }

      target.role = newRole;

      return trx.save(User, target);
    });
  }

  async setUserActive(targetId: string, isActive: boolean, currentUserId: string): Promise<User> {
    this.assertNotSelf(targetId, currentUserId);

    const user = await this.findUserById(targetId);

    if (!isActive && user.role === UserRole.ADMIN) {
      const adminCount = await this.usersRepo.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new BadRequestException("System must retain at least one admin");
      }
    }

    user.isActive = isActive;

    return this.usersRepo.save(user);
  }

  async removeUser(targetId: string, currentUserId: string): Promise<void> {
    this.assertNotSelf(targetId, currentUserId);

    await this.dataSource.transaction(async (trx) => {
      const target = await trx.findOne(User, { where: { id: targetId } });

      if (!target) {
        throw new NotFoundException("User not found");
      }

      if (target.role === UserRole.ADMIN) {
        const adminCount = await trx.count(User, {
          where: { role: UserRole.ADMIN, isActive: true },
        });

        if (adminCount <= 1) {
          throw new BadRequestException("System must retain at least one admin");
        }
      }

      await trx.remove(User, target);
    });
  }

  async fleetOverview() {
    const rows = await this.vehiclesRepo.query(`
      SELECT
        v.id,
        v.plate,
        v."vehicleType",
        v."isActive",
        v."lastLocation",
        v."updatedAt",
        COALESCE(ac."alertCount", 0)::int AS "alertCount24h"
      FROM vehicle v
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "alertCount"
        FROM alert a
        WHERE a."vehicleId" = v.id
          AND a."createdAt" >= NOW() - INTERVAL '24 hours'
      ) ac ON true
      ORDER BY v."updatedAt" DESC
    `);

    return rows;
  }

  private assertNotSelf(targetId: string, currentUserId: string): void {
    if (targetId === currentUserId) {
      throw new BadRequestException("Cannot perform this operation on your own account");
    }
  }

  private async getUserStats() {
    const [row] = await this.usersRepo.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admin,
        COUNT(*) FILTER (WHERE role = 'manager')::int AS manager,
        COUNT(*) FILTER (WHERE role = 'viewer')::int AS viewer,
        COUNT(*) FILTER (WHERE "isActive" = true AND "lastLoginAt" >= NOW() - INTERVAL '30 days')::int AS "activatedLast30Days",
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days')::int AS "registeredLast30Days"
      FROM "user"
    `);

    return {
      total: row.total,
      byRole: {
        admin: row.admin,
        manager: row.manager,
        viewer: row.viewer,
      },
      activatedLast30Days: row.activatedLast30Days,
      registeredLast30Days: row.registeredLast30Days,
    };
  }

  private async getVehicleStats() {
    const [row] = await this.vehiclesRepo.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "isActive" = true)::int AS active,
        COUNT(*) FILTER (WHERE "isActive" = false)::int AS inactive,
        COUNT(*) FILTER (WHERE "vehicleType" = 'car')::int AS car,
        COUNT(*) FILTER (WHERE "vehicleType" = 'truck')::int AS truck,
        COUNT(*) FILTER (WHERE "vehicleType" = 'van')::int AS van,
        COUNT(*) FILTER (WHERE "vehicleType" = 'motorcycle')::int AS motorcycle,
        COUNT(*) FILTER (WHERE "vehicleType" = 'bus')::int AS bus,
        COUNT(*) FILTER (WHERE "vehicleType" = 'other')::int AS other,
        COUNT(*) FILTER (WHERE "isActive" = true AND "lastLocation"->>'status' = 'moving')::int AS moving,
        COUNT(*) FILTER (WHERE "isActive" = true AND "lastLocation"->>'status' = 'idle')::int AS idle,
        COUNT(*) FILTER (WHERE "isActive" = true AND "lastLocation"->>'status' = 'offline')::int AS offline,
        COUNT(*) FILTER (WHERE "isActive" = true AND "lastLocation" IS NULL)::int AS unknown
      FROM vehicle
    `);

    return {
      total: row.total,
      active: row.active,
      inactive: row.inactive,
      byType: {
        car: row.car,
        truck: row.truck,
        van: row.van,
        motorcycle: row.motorcycle,
        bus: row.bus,
        other: row.other,
      },
      byStatus: {
        moving: row.moving,
        idle: row.idle,
        offline: row.offline,
        unknown: row.unknown,
      },
    };
  }

  private async getAlertStats() {
    const [row] = await this.alertsRepo.query(`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS today,
        COUNT(*) FILTER (WHERE "createdAt" >= DATE_TRUNC('week', CURRENT_DATE))::int AS "thisWeek",
        COUNT(*) FILTER (WHERE type = 'speed')::int AS speed,
        COUNT(*) FILTER (WHERE type = 'idle')::int AS idle,
        COUNT(*) FILTER (WHERE type = 'geofence_enter')::int AS "geofenceEnter",
        COUNT(*) FILTER (WHERE type = 'geofence_exit')::int AS "geofenceExit",
        COUNT(*) FILTER (WHERE acknowledged = false)::int AS unacknowledged
      FROM alert
    `);

    return {
      today: row.today,
      thisWeek: row.thisWeek,
      byType: {
        speed: row.speed,
        idle: row.idle,
        geofence_enter: row.geofenceEnter,
        geofence_exit: row.geofenceExit,
      },
      unacknowledged: row.unacknowledged,
    };
  }

  private async getTripStats() {
    const [row] = await this.tripsRepo.query(`
      SELECT
        COUNT(*) FILTER (WHERE "startedAt" >= CURRENT_DATE)::int AS today,
        COUNT(*) FILTER (WHERE "startedAt" >= DATE_TRUNC('week', CURRENT_DATE))::int AS "thisWeek",
        COALESCE(SUM("distanceKm") FILTER (WHERE "startedAt" >= CURRENT_DATE)::numeric, 0)::float AS "totalDistanceTodayKm",
        COALESCE(SUM("distanceKm") FILTER (WHERE "startedAt" >= DATE_TRUNC('week', CURRENT_DATE))::numeric, 0)::float AS "totalDistanceWeekKm"
      FROM trip
    `);

    return {
      today: row.today,
      thisWeek: row.thisWeek,
      totalDistanceTodayKm: row.totalDistanceTodayKm,
      totalDistanceWeekKm: row.totalDistanceWeekKm,
    };
  }

  private async getTopViolators() {
    const rows = await this.alertsRepo.query(`
      SELECT
        v.id,
        v.plate,
        v."vehicleType",
        COUNT(a.id)::int AS "alertCount"
      FROM alert a
      JOIN vehicle v ON v.id = a."vehicleId"
      WHERE a."createdAt" >= CURRENT_DATE
      GROUP BY v.id, v.plate, v."vehicleType"
      ORDER BY "alertCount" DESC
      LIMIT 5
    `);

    return rows;
  }
}
