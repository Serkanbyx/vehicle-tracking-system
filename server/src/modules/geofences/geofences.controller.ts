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
import type { RequestUser } from "../../common/interfaces/request-user.interface.js";
import type {
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
  async create(@Body() dto: CreateGeofenceDto, @CurrentUser() user: RequestUser) {
    return this.geofencesService.create(dto, user);
  }

  @Get()
  async findAll(@Query() query: GeofenceQueryDto) {
    return this.geofencesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.geofencesService.findOne(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateGeofenceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.geofencesService.update(id, dto, user);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @Delete(":id")
  async remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    await this.geofencesService.remove(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post(":id/test")
  async test(@Param("id", ParseUUIDPipe) id: string, @Body() point: TestPointDto) {
    return this.geofencesService.test(id, point);
  }
}
