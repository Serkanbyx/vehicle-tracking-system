import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { AdminService } from "./admin.service.js";
import { AdminSetRoleDto, AdminSetStatusDto, AdminUserQueryDto } from "./dto/index.js";

@Roles(UserRole.ADMIN)
@Throttle({ admin: {} })
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  async getStats() {
    return this.adminService.getStats();
  }

  @Get("users")
  async findUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Get("users/:id")
  async findUserById(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminService.findUserById(id);
  }

  @Patch("users/:id/role")
  async setUserRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminSetRoleDto,
    @CurrentUser("id") currentUserId: string,
  ) {
    return this.adminService.setUserRole(id, dto.role, currentUserId);
  }

  @Patch("users/:id/status")
  async setUserActive(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminSetStatusDto,
    @CurrentUser("id") currentUserId: string,
  ) {
    return this.adminService.setUserActive(id, dto.isActive, currentUserId);
  }

  @Delete("users/:id")
  async removeUser(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") currentUserId: string,
  ) {
    await this.adminService.removeUser(id, currentUserId);
  }

  @Get("fleet")
  async fleetOverview() {
    return this.adminService.fleetOverview();
  }
}
