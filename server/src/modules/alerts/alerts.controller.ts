import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import type { AlertsService } from "./alerts.service.js";
import type { AckManyDto, AlertQueryDto } from "./dto/index.js";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findAll(@Query() query: AlertQueryDto) {
    const result = await this.alertsService.findAll(query);

    return { success: true, data: result };
  }

  @Get("stats")
  async stats() {
    const result = await this.alertsService.stats();

    return { success: true, data: result };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(":id/ack")
  async acknowledge(@Param("id", ParseUUIDPipe) id: string, @CurrentUser("id") userId: string) {
    const alert = await this.alertsService.acknowledge(id, userId);

    return { success: true, data: alert };
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post("ack-many")
  async acknowledgeMany(@Body() dto: AckManyDto, @CurrentUser("id") userId: string) {
    const result = await this.alertsService.acknowledgeMany(dto.ids, userId);

    return { success: true, data: result };
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.alertsService.remove(id);

    return { success: true, data: null };
  }
}
