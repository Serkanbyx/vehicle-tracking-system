import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  GeofenceAppliesTo,
  GeofenceShape,
} from "../../common/enums/geofence.enum.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { escapeRegex } from "../../common/utils/escape-regex.js";
import type { CreateGeofenceDto } from "./dto/create-geofence.dto.js";
import type { GeofenceQueryDto } from "./dto/geofence-query.dto.js";
import type { TestPointDto } from "./dto/test-point.dto.js";
import type { UpdateGeofenceDto } from "./dto/update-geofence.dto.js";
import { Geofence } from "./geofence.entity.js";

interface CurrentUser {
  id: string;
  role: UserRole;
}

@Injectable()
export class GeofencesService {
  constructor(
    @InjectRepository(Geofence)
    private readonly geofencesRepo: Repository<Geofence>,
  ) {}

  async create(dto: CreateGeofenceDto, user: CurrentUser): Promise<Geofence> {
    this.validateShapeFields(dto);

    const baseValues: Record<string, unknown> = {
      name: dto.name,
      description: dto.description ?? null,
      shape: dto.shape,
      direction: dto.direction,
      appliesTo: dto.appliesTo,
      vehicleIds: dto.vehicleIds ?? [],
      isActive: true,
      color: dto.color ?? "#3b82f6",
      createdById: user.id,
    };

    const qb = this.geofencesRepo
      .createQueryBuilder()
      .insert()
      .into(Geofence);

    if (dto.shape === GeofenceShape.POLYGON) {
      const geoJson = JSON.stringify(dto.geometry);

      qb.values({
        ...baseValues,
        geometry: () => `ST_GeomFromGeoJSON(:geoJson)`,
      });
      qb.setParameter("geoJson", geoJson);
    } else {
      qb.values({
        ...baseValues,
        radiusMeters: dto.radiusMeters!,
        circleCenter: () => `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`,
      });
      qb.setParameter("lng", dto.circleCenter!.lng);
      qb.setParameter("lat", dto.circleCenter!.lat);
    }

    const result = await qb.returning("*").execute();

    return this.findOne(result.generatedMaps[0].id as string);
  }

  async findAll(query: GeofenceQueryDto) {
    const qb = this.geofencesRepo.createQueryBuilder("g");

    if (query.isActive !== undefined) {
      qb.andWhere("g.isActive = :isActive", { isActive: query.isActive });
    }

    if (query.shape) {
      qb.andWhere("g.shape = :shape", { shape: query.shape });
    }

    if (query.q) {
      const escaped = escapeRegex(query.q);
      qb.andWhere("g.name ILIKE :q", { q: `%${escaped}%` });
    }

    qb.orderBy("g.createdAt", "DESC");

    return qb.getMany();
  }

  async findOne(id: string): Promise<Geofence> {
    const geofence = await this.geofencesRepo.findOne({ where: { id } });

    if (!geofence) {
      throw new NotFoundException("Geofence not found");
    }

    return geofence;
  }

  async update(
    id: string,
    dto: UpdateGeofenceDto,
    user: CurrentUser,
  ): Promise<Geofence> {
    const geofence = await this.findOne(id);

    this.assertOwnership(geofence, user);

    Object.assign(geofence, dto);

    return this.geofencesRepo.save(geofence);
  }

  async remove(id: string, user: CurrentUser): Promise<void> {
    const geofence = await this.findOne(id);

    this.assertOwnership(geofence, user);

    await this.geofencesRepo.remove(geofence);
  }

  async test(
    id: string,
    point: TestPointDto,
  ): Promise<{ inside: boolean }> {
    const geofence = await this.findOne(id);

    let inside: boolean;

    if (geofence.shape === GeofenceShape.POLYGON) {
      const result = await this.geofencesRepo.query(
        `SELECT ST_Contains(
          geometry,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        ) AS inside
        FROM geofence WHERE id = $3`,
        [point.lng, point.lat, id],
      );

      inside = result[0]?.inside ?? false;
    } else {
      const result = await this.geofencesRepo.query(
        `SELECT ST_DWithin(
          circle_center::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          radius_meters
        ) AS inside
        FROM geofence WHERE id = $3`,
        [point.lng, point.lat, id],
      );

      inside = result[0]?.inside ?? false;
    }

    return { inside };
  }

  async findContaining(
    vehicleId: string,
    point: { lng: number; lat: number },
  ): Promise<Geofence[]> {
    return this.geofencesRepo.query(
      `SELECT g.*
       FROM geofence g
       WHERE g.is_active = true
         AND (g.applies_to = 'all' OR $1 = ANY(g.vehicle_ids))
         AND (
           (g.shape = 'polygon' AND ST_Contains(g.geometry, ST_SetSRID(ST_MakePoint($2, $3), 4326)))
           OR
           (g.shape = 'circle' AND ST_DWithin(g.circle_center::geography,
                                              ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
                                              g.radius_meters))
         )`,
      [vehicleId, point.lng, point.lat],
    );
  }

  private validateShapeFields(dto: CreateGeofenceDto): void {
    if (dto.shape === GeofenceShape.POLYGON) {
      if (!dto.geometry) {
        throw new BadRequestException(
          "geometry is required for polygon shape",
        );
      }
    } else {
      if (!dto.circleCenter) {
        throw new BadRequestException(
          "circleCenter is required for circle shape",
        );
      }
      if (dto.radiusMeters === undefined) {
        throw new BadRequestException(
          "radiusMeters is required for circle shape",
        );
      }
    }

    if (
      dto.appliesTo === GeofenceAppliesTo.SPECIFIC &&
      (!dto.vehicleIds || dto.vehicleIds.length === 0)
    ) {
      throw new BadRequestException(
        "vehicleIds is required when appliesTo is 'specific'",
      );
    }
  }

  private assertOwnership(geofence: Geofence, user: CurrentUser): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (geofence.createdById !== user.id) {
      throw new ForbiddenException("Not authorized to modify this geofence");
    }
  }
}
