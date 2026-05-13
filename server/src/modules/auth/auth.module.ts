import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module.js";
import { AuthService } from "./auth.service.js";
import {
  JwtRefreshStrategy,
  JwtStrategy,
  LocalStrategy,
} from "./strategies/index.js";

@Module({
  imports: [
    UsersModule,
    PassportModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: cfg.get<string>("JWT_ACCESS_TTL") || "15m",
        },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
