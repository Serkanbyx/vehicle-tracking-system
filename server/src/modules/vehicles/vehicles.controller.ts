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
  BulkActivateDto,
  CreateVehicleDto,
  NearbyQueryDto,
  UpdateVehicleDto,
  VehicleQueryDto,
} from "./dto/index.js";
import { VehiclesService } from "./vehicles.service.js";

@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

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
