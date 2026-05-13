import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { AdminService } from "./admin.service.js";
import {
  AdminSetRoleDto,
  AdminSetStatusDto,
  AdminUserQueryDto,
} from "./dto/index.js";

@Roles(UserRole.ADMIN)
@Throttle({ admin: {} })
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  async getStats() {
    const stats = await this.adminService.getStats();

    return { success: true, data: stats };
  }

  @Get("users")
  async findUsers(@Query() query: AdminUserQueryDto) {
    const result = await this.adminService.findUsers(query);

    return { success: true, data: result };
  }

  @Get("users/:id")
  async findUserById(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.adminService.findUserById(id);

    return { success: true, data: user };
  }

  @Patch("users/:id/role")
  async setUserRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminSetRoleDto,
    @CurrentUser("id") currentUserId: string,
  ) {
    const user = await this.adminService.setUserRole(
      id,
      dto.role,
      currentUserId,
    );

    return { success: true, data: user };
  }

  @Patch("users/:id/status")
  async setUserActive(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminSetStatusDto,
    @CurrentUser("id") currentUserId: string,
  ) {
    const user = await this.adminService.setUserActive(
      id,
      dto.isActive,
      currentUserId,
    );

    return { success: true, data: user };
  }

  @Delete("users/:id")
  async removeUser(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") currentUserId: string,
  ) {
    await this.adminService.removeUser(id, currentUserId);

    return { success: true, data: null };
  }

  @Get("fleet")
  async fleetOverview() {
    const fleet = await this.adminService.fleetOverview();

    return { success: true, data: fleet };
  }
}
