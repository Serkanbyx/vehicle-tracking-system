import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { escapeRegex } from "../../common/utils/escape-regex.js";
import type { BulkActivateDto } from "./dto/bulk-activate.dto.js";
import type { CreateVehicleDto } from "./dto/create-vehicle.dto.js";
import type { NearbyQueryDto } from "./dto/nearby-query.dto.js";
import type { UpdateVehicleDto } from "./dto/update-vehicle.dto.js";
import type { VehicleQueryDto } from "./dto/vehicle-query.dto.js";
import { Vehicle } from "./vehicle.entity.js";

interface CurrentUser {
  id: string;
  role: UserRole;
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto, currentUser: CurrentUser): Promise<Vehicle> {
    const vehicle = this.vehiclesRepo.create({
      ...dto,
      createdById: currentUser.id,
    });

    return this.vehiclesRepo.save(vehicle);
  }

  async findAll(query: VehicleQueryDto) {
    const qb = this.vehiclesRepo.createQueryBuilder("v");

    qb.where("v.isActive = :isActive", { isActive: true });

    if (query.q) {
      const escaped = escapeRegex(query.q);
      qb.andWhere(`(v.plate ILIKE :q OR v.model ILIKE :q OR v.driver->>'name' ILIKE :q)`, {
        q: `%${escaped}%`,
      });
    }

    if (query.vehicleType) {
      qb.andWhere("v.vehicleType = :vehicleType", {
        vehicleType: query.vehicleType,
      });
    }

    if (query.status) {
      qb.andWhere("v.lastLocation->>'status' = :status", {
        status: query.status,
      });
    }

    if (query.tag) {
      qb.andWhere(":tag = ANY(v.tags)", { tag: query.tag });
    }

    switch (query.sort) {
      case "plate":
        qb.orderBy("v.plate", "ASC");
        break;
      case "speed":
        qb.orderBy("(v.lastLocation->>'speed')::float", "DESC", "NULLS LAST");
        break;
      default:
        qb.orderBy("v.updatedAt", "DESC");
        break;
    }

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

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException("Vehicle not found");
    }

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto, currentUser: CurrentUser): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    this.assertOwnership(vehicle, currentUser);

    Object.assign(vehicle, dto);

    return this.vehiclesRepo.save(vehicle);
  }

  async remove(id: string, currentUser: CurrentUser): Promise<void> {
    const vehicle = await this.findOne(id);

    this.assertOwnership(vehicle, currentUser);

    await this.vehiclesRepo.remove(vehicle);
  }

  async nearby(query: NearbyQueryDto) {
    const radiusMeters = query.km * 1000;

    const vehicles = await this.vehiclesRepo
      .createQueryBuilder("v")
      .where("v.isActive = true")
      .andWhere("v.lastLocation IS NOT NULL")
      .andWhere(
        `(
          6371000 * acos(
            cos(radians(:lat)) * cos(radians((v."lastLocation"->>'lat')::float))
            * cos(radians((v."lastLocation"->>'lng')::float) - radians(:lng))
            + sin(radians(:lat)) * sin(radians((v."lastLocation"->>'lat')::float))
          )
        ) <= :radius`,
        { lat: query.lat, lng: query.lng, radius: radiusMeters },
      )
      .getMany();

    return vehicles;
  }

  async bulkActivate(dto: BulkActivateDto): Promise<{ affected: number }> {
    const result = await this.vehiclesRepo.update({ id: In(dto.ids) }, { isActive: dto.isActive });

    return { affected: result.affected ?? 0 };
  }

  private assertOwnership(vehicle: Vehicle, currentUser: CurrentUser): void {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    const isOwner = vehicle.createdById === currentUser.id;
    const isAssigned = vehicle.assignedManagers.includes(currentUser.id);

    if (!isOwner && !isAssigned) {
      throw new ForbiddenException("Not authorized to modify this vehicle");
    }
  }
}
