import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { Alert } from "./alert.entity.js";
import type { AlertQueryDto } from "./dto/alert-query.dto.js";

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertsRepo: Repository<Alert>,
  ) {}

  async findAll(query: AlertQueryDto) {
    const qb = this.alertsRepo.createQueryBuilder("a");

    if (query.vehicleId) {
      qb.andWhere("a.vehicleId = :vehicleId", {
        vehicleId: query.vehicleId,
      });
    }

    if (query.type) {
      qb.andWhere("a.type = :type", { type: query.type });
    }

    if (query.severity) {
      qb.andWhere("a.severity = :severity", { severity: query.severity });
    }

    if (query.acknowledged !== undefined) {
      qb.andWhere("a.acknowledged = :acknowledged", {
        acknowledged: query.acknowledged,
      });
    }

    if (query.from) {
      qb.andWhere("a.createdAt >= :from", { from: query.from });
    }

    if (query.to) {
      qb.andWhere("a.createdAt <= :to", { to: query.to });
    }

    qb.orderBy("a.createdAt", "DESC");

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

  async acknowledge(id: string, userId: string): Promise<Alert | null> {
    const result = await this.alertsRepo.query(
      `UPDATE alert
       SET acknowledged = true,
           "acknowledgedById" = $1,
           "acknowledgedAt" = now()
       WHERE id = $2 AND acknowledged = false
       RETURNING *`,
      [userId, id],
    );

    return result[0] ?? null;
  }

  async acknowledgeMany(ids: string[], userId: string): Promise<{ affected: number }> {
    const result = await this.alertsRepo
      .createQueryBuilder()
      .update(Alert)
      .set({
        acknowledged: true,
        acknowledgedById: userId,
        acknowledgedAt: () => "now()",
      })
      .where("id IN (:...ids)", { ids })
      .andWhere("acknowledged = false")
      .execute();

    return { affected: result.affected ?? 0 };
  }

  async remove(id: string): Promise<void> {
    const alert = await this.alertsRepo.findOne({ where: { id } });

    if (!alert) {
      throw new NotFoundException("Alert not found");
    }

    await this.alertsRepo.remove(alert);
  }

  async stats() {
    const [row] = await this.alertsRepo.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE acknowledged = false)::int AS unacknowledged,
        COUNT(*) FILTER (WHERE type = 'speed')::int AS "speed",
        COUNT(*) FILTER (WHERE type = 'idle')::int AS "idle",
        COUNT(*) FILTER (WHERE type = 'geofence_enter')::int AS "geofence_enter",
        COUNT(*) FILTER (WHERE type = 'geofence_exit')::int AS "geofence_exit",
        COUNT(*) FILTER (WHERE severity = 'info')::int AS "info",
        COUNT(*) FILTER (WHERE severity = 'warning')::int AS "warning",
        COUNT(*) FILTER (WHERE severity = 'critical')::int AS "critical"
      FROM alert
    `);

    return {
      total: row.total,
      unacknowledged: row.unacknowledged,
      byType: {
        speed: row.speed,
        idle: row.idle,
        geofence_enter: row.geofence_enter,
        geofence_exit: row.geofence_exit,
      },
      bySeverity: {
        info: row.info,
        warning: row.warning,
        critical: row.critical,
      },
    };
  }
}
