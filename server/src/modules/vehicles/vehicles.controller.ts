import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import type { RequestUser } from "../../common/interfaces/request-user.interface.js";
import { ExportService } from "../../common/utils/export.service.js";
import { LocationsService } from "../locations/locations.service.js";
import {
  type BulkActivateDto,
  type CreateVehicleDto,
  ExportFormat,
  type HeatmapQueryDto,
  type NearbyQueryDto,
  type RouteExportQueryDto,
  type UpdateVehicleDto,
  type VehicleQueryDto,
} from "./dto/index.js";
import { VehiclesService } from "./vehicles.service.js";

@Controller("vehicles")
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly locationsService: LocationsService,
    private readonly exportService: ExportService,
  ) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateVehicleDto, @CurrentUser() user: RequestUser) {
    return this.vehiclesService.create(dto, user);
  }

  @Get()
  async findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get("nearby")
  async nearby(@Query() query: NearbyQueryDto) {
    return this.vehiclesService.nearby(query);
  }

  @Get(":id/heatmap")
  async heatmap(@Param("id", ParseUUIDPipe) id: string, @Query() query: HeatmapQueryDto) {
    return this.locationsService.getHeatmap(id, new Date(query.from), new Date(query.to));
  }

  @Throttle({ export: {} })
  @Get(":id/export")
  async exportRoute(
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: RouteExportQueryDto,
    @Res() res: Response,
  ) {
    const vehicle = await this.vehiclesService.findOne(id);
    const rows = await this.locationsService.getHistory(id, {
      from: new Date(query.from),
      to: new Date(query.to),
    });

    const plate = vehicle.plate.replace(/[^A-Za-z0-9-]/g, "");
    const fromDate = query.from.slice(0, 10);
    const toDate = query.to.slice(0, 10);

    if (query.format === ExportFormat.GEOJSON) {
      const geoJson = this.exportService.locationsToGeoJson(rows, vehicle);

      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="vehicle-${plate}-${fromDate}-${toDate}.geojson"`,
      );
      res.json(geoJson);
    } else {
      const csv = this.exportService.locationsToCsv(rows);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="vehicle-${plate}-${fromDate}-${toDate}.csv"`,
      );
      res.send(csv);
    }
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.vehiclesService.update(id, dto, user);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Delete(":id")
  async remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    await this.vehiclesService.remove(id, user);
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post("bulk-activate")
  async bulkActivate(@Body() dto: BulkActivateDto) {
    return this.vehiclesService.bulkActivate(dto);
  }
}
