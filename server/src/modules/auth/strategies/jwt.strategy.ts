import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { UserRole } from "../../../common/enums/user-role.enum.js";

interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET"),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, role: payload.role, email: payload.email };
  }
}
