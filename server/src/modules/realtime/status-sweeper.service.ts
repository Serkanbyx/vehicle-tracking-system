import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { AlertEngineService } from "../alerts/alert-engine.service.js";
import { Vehicle } from "../vehicles/vehicle.entity.js";
import { RoomManager } from "./room-manager.service.js";

@Injectable()
export class StatusSweeperService {
  private readonly logger = new Logger(StatusSweeperService.name);
  private readonly idleThresholdMs: number;
  private readonly offlineThresholdMs: number;
  private readonly idleAlertedSet = new Set<string>();

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    private readonly roomManager: RoomManager,
    private readonly alertEngine: AlertEngineService,
    private readonly configService: ConfigService,
  ) {
    const idleMin = configService.get<number>("app.idleThresholdMin") ?? 10;
    this.idleThresholdMs = idleMin * 60 * 1000;
    this.offlineThresholdMs = idleMin * 2 * 60 * 1000;
  }

  @Cron("*/60 * * * * *")
  async sweep(): Promise<void> {
    const vehicles = await this.vehiclesRepo.find({
      where: { lastLocation: Not(IsNull()) },
      select: ["id", "lastLocation"],
    });

    const now = Date.now();

    for (const vehicle of vehicles) {
      const loc = vehicle.lastLocation;
      if (!loc?.timestamp) continue;

      const age = now - new Date(loc.timestamp).getTime();

      if (age > this.offlineThresholdMs && loc.status !== "offline") {
        await this.vehiclesRepo
          .createQueryBuilder()
          .update(Vehicle)
          .set({
            lastLocation: () =>
              `jsonb_set("lastLocation", '{status}', '"offline"')`,
          })
          .where("id = :id", { id: vehicle.id })
          .execute();

        this.roomManager.broadcastToMany(
          [
            `vehicle:${vehicle.id}`,
            "role:viewer",
            "role:manager",
            "role:admin",
          ],
          { type: "vehicle:status", vehicleId: vehicle.id, status: "offline" },
        );
      }

      if (
        loc.status === "idle" &&
        age >= this.idleThresholdMs &&
        !this.idleAlertedSet.has(vehicle.id)
      ) {
        await this.alertEngine.createIdleAlert({
          id: vehicle.id,
          lastLocation: loc,
        });
        this.idleAlertedSet.add(vehicle.id);
      }

      if (loc.status === "moving") {
        this.idleAlertedSet.delete(vehicle.id);
      }
    }
  }
}
