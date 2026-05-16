import { randomUUID } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import type { Response } from "express";
import type { Repository } from "typeorm";
import { UserRole } from "../../common/enums/user-role.enum.js";
import { User } from "../users/user.entity.js";
import type { RegisterDto } from "./dto/register.dto.js";
import type { UpdateMeDto } from "./dto/update-me.dto.js";

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

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  preferences: Record<string, unknown>;
}

export interface AuthResponse {
  accessToken: string;
  user: SanitizedUser;
}

@Injectable()
export class AuthService {
  private readonly jwtRefresh: JwtService;
  private readonly isProduction: boolean;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtAccess: JwtService,
    configService: ConfigService,
  ) {
    this.jwtRefresh = new JwtService({
      secret: configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      signOptions: {
        expiresIn: (configService.get<string>("JWT_REFRESH_TTL") || "7d") as any,
      },
    });

    this.isProduction = configService.get<string>("NODE_ENV") === "production";
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

    if (!user?.isActive || !user.refreshTokenHash) {
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

    if (!user?.isActive) {
      return null;
    }

    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /* ───── Registration ───── */

  async register(dto: RegisterDto, res: Response): Promise<AuthResponse> {
    const existingUser = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("Email already in use");
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.VIEWER,
    });

    const savedUser = await this.usersRepo.save(user);

    const accessToken = this.signAccessToken(savedUser);
    const { token: refreshToken, jti } = this.signRefreshToken(savedUser);

    await this.usersRepo.update(savedUser.id, {
      refreshTokenHash: await this.hashJti(jti),
    });

    this.setRefreshCookie(res, refreshToken);

    return {
      accessToken,
      user: this.sanitizeUser(savedUser),
    };
  }

  /* ───── Login ───── */

  async login(user: Omit<User, "password">, res: Response): Promise<AuthResponse> {
    const accessToken = this.signAccessToken(user as TokenUser);
    const { token: refreshToken, jti } = this.signRefreshToken(user);

    await this.usersRepo.update(user.id, {
      refreshTokenHash: await this.hashJti(jti),
      lastLoginAt: new Date(),
    });

    this.setRefreshCookie(res, refreshToken);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  /* ───── Profile ───── */

  async getMe(userId: string): Promise<SanitizedUser> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.sanitizeUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<SanitizedUser> {
    await this.usersRepo.update(userId, dto);

    return this.getMe(userId);
  }

  /* ───── Account deletion ───── */

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ["id", "password"],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid password");
    }

    await this.usersRepo.remove(user);
  }

  /* ───── Helpers ───── */

  private sanitizeUser(user: Partial<User>): SanitizedUser {
    return {
      id: user.id!,
      name: user.name!,
      email: user.email!,
      role: user.role!,
      avatarUrl: user.avatarUrl ?? null,
      preferences: (user.preferences as Record<string, unknown>) ?? {},
    };
  }
}
