import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { JwtRefreshGuard } from "../../common/guards/jwt-refresh.guard.js";
import { LocalAuthGuard } from "../../common/guards/local-auth.guard.js";
import type { User } from "../users/user.entity.js";
import type { AuthService } from "./auth.service.js";
import type { ChangePasswordDto, DeleteAccountDto, RegisterDto, UpdateMeDto } from "./dto/index.js";

@ApiTags("Auth")
@ApiBearerAuth("JWT")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { ttl: 900_000, limit: 10 } })
  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, res);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ auth: { ttl: 900_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @CurrentUser() user: Omit<User, "password">,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(user, res);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(
    @CurrentUser("refreshToken") refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken: newRefresh } =
      await this.authService.verifyAndRotateRefresh(refreshToken);

    this.authService.setRefreshCookie(res, newRefresh);

    return { accessToken };
  }

  @Get("me")
  async me(@CurrentUser("id") userId: string) {
    return this.authService.getMe(userId);
  }

  @Patch("me")
  async updateMe(@CurrentUser("id") userId: string, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(userId, dto);
  }

  @Throttle({ auth: { ttl: 900_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @Post("change-password")
  async changePassword(
    @CurrentUser("id") userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
    this.authService.clearRefreshCookie(res);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@CurrentUser("id") userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId, res);
  }

  @Delete("me")
  async deleteAccount(
    @CurrentUser("id") userId: string,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteAccount(userId, dto.password);
    this.authService.clearRefreshCookie(res);
  }
}
