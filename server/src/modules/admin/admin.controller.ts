import { Controller, Get } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { AdminService } from "./admin.service.js";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.ADMIN)
  @Throttle({ admin: {} })
  @Get("stats")
  async getStats() {
    const stats = await this.adminService.getStats();

    return { success: true, data: stats };
  }
}
