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
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import type { AlertsService } from "./alerts.service.js";
import type { AckManyDto, AlertQueryDto } from "./dto/index.js";

@ApiTags("Alerts")
@ApiBearerAuth("JWT")
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findAll(@Query() query: AlertQueryDto) {
    return this.alertsService.findAll(query);
  }

  @Get("stats")
  async stats() {
    return this.alertsService.stats();
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(":id/ack")
  async acknowledge(@Param("id", ParseUUIDPipe) id: string, @CurrentUser("id") userId: string) {
    return this.alertsService.acknowledge(id, userId);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post("ack-many")
  async acknowledgeMany(@Body() dto: AckManyDto, @CurrentUser("id") userId: string) {
    return this.alertsService.acknowledgeMany(dto.ids, userId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(":id")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.alertsService.remove(id);
  }
}
