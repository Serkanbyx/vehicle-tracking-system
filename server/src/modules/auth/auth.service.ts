import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { Repository } from "typeorm";
import type { UserRole } from "../../common/enums/user-role.enum.js";
import { User } from "../users/user.entity.js";

const PASSWORD_ROUNDS = 12;
const JTI_ROUNDS = 10;

interface TokenUser {
  id: string;
  role: UserRole;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly jwtRefresh: JwtService;
  private readonly isProduction: boolean;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtAccess: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtRefresh = new JwtService({
      secret: configService.get<string>("JWT_REFRESH_SECRET"),
      signOptions: {
        expiresIn: configService.get<string>("JWT_REFRESH_TTL") || "7d",
      },
    });

    this.isProduction =
      configService.get<string>("NODE_ENV") === "production";
  }

  /* ───── Password helpers ───── */

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, PASSWORD_ROUNDS);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /* ───── Token signing ───── */

  signAccessToken(user: TokenUser): string {
    return this.jwtAccess.sign({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
  }

  signRefreshToken(user: Pick<TokenUser, "id">): {
    token: string;
    jti: string;
  } {
    const jti = randomUUID();
    const token = this.jwtRefresh.sign({ sub: user.id, jti });

    return { token, jti };
  }

  async hashJti(jti: string): Promise<string> {
    return bcrypt.hash(jti, JTI_ROUNDS);
  }

  /* ───── Cookie helpers ───── */

  setRefreshCookie(res: Response, token: string): void {
    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.cookie("refresh_token", "", {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    });
  }

  /* ───── Refresh rotation with reuse detection ───── */

  async verifyAndRotateRefresh(rawToken: string): Promise<TokenPair> {
    let payload: { sub: string; jti: string };

    try {
      payload = await this.jwtRefresh.verifyAsync(rawToken);
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
      select: ["id", "role", "email", "isActive", "refreshTokenHash"],
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }

    const match = await bcrypt.compare(payload.jti, user.refreshTokenHash);

    if (!match) {
      await this.usersRepo.update(user.id, { refreshTokenHash: null });
      throw new UnauthorizedException("Session revoked");
    }

    const { token: newRefresh, jti: newJti } = this.signRefreshToken(user);
    await this.usersRepo.update(user.id, {
      refreshTokenHash: await this.hashJti(newJti),
    });

    const accessToken = this.signAccessToken(user);
    return { accessToken, refreshToken: newRefresh };
  }

  /* ───── Logout ───── */

  async logout(userId: string, res: Response): Promise<void> {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
    this.clearRefreshCookie(res);
  }

  /* ───── Change password ───── */

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ["id", "password"],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatch = await this.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepo.update(userId, {
      password: hashedPassword,
      refreshTokenHash: null,
    });
  }

  /* ───── Credential validation (used by LocalStrategy) ───── */

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    const user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ["id", "name", "email", "password", "role", "isActive"],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }
}
