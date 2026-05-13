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
import { ExportService } from "../../common/utils/export.service.js";
import { LocationsService } from "../locations/locations.service.js";
import {
  BulkActivateDto,
  CreateVehicleDto,
  ExportFormat,
  NearbyQueryDto,
  RouteExportQueryDto,
  UpdateVehicleDto,
  VehicleQueryDto,
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
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: any,
  ) {
    const vehicle = await this.vehiclesService.create(dto, user);

    return { success: true, data: vehicle };
  }

  @Get()
  async findAll(@Query() query: VehicleQueryDto) {
    const result = await this.vehiclesService.findAll(query);

    return { success: true, data: result };
  }

  @Get("nearby")
  async nearby(@Query() query: NearbyQueryDto) {
    const vehicles = await this.vehiclesService.nearby(query);

    return { success: true, data: vehicles };
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
    const vehicle = await this.vehiclesService.findOne(id);

    return { success: true, data: vehicle };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: any,
  ) {
    const vehicle = await this.vehiclesService.update(id, dto, user);

    return { success: true, data: vehicle };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Delete(":id")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.vehiclesService.remove(id, user);

    return { success: true, data: null };
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post("bulk-activate")
  async bulkActivate(@Body() dto: BulkActivateDto) {
    const result = await this.vehiclesService.bulkActivate(dto);

    return { success: true, data: result };
  }
}
