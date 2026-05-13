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
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import {
  CreateGeofenceDto,
  GeofenceQueryDto,
  TestPointDto,
  UpdateGeofenceDto,
} from "./dto/index.js";
import { GeofencesService } from "./geofences.service.js";

@Controller("geofences")
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: CreateGeofenceDto,
    @CurrentUser() user: any,
  ) {
    const geofence = await this.geofencesService.create(dto, user);

    return { success: true, data: geofence };
  }

  @Get()
  async findAll(@Query() query: GeofenceQueryDto) {
    const geofences = await this.geofencesService.findAll(query);

    return { success: true, data: geofences };
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    const geofence = await this.geofencesService.findOne(id);

    return { success: true, data: geofence };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateGeofenceDto,
    @CurrentUser() user: any,
  ) {
    const geofence = await this.geofencesService.update(id, dto, user);

    return { success: true, data: geofence };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Delete(":id")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.geofencesService.remove(id, user);

    return { success: true, data: null };
  }

  @HttpCode(HttpStatus.OK)
  @Post(":id/test")
  async test(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() point: TestPointDto,
  ) {
    const result = await this.geofencesService.test(id, point);

    return { success: true, data: result };
  }
}
