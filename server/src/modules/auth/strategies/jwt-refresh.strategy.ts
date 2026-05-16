import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { Strategy } from "passport-jwt";

interface RefreshPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

function extractFromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractFromCookie,
      secretOrKey: configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      ignoreExpiration: false,
      passReqToCallback: true as const,
    });
  }

  validate(req: Request, payload: RefreshPayload) {
    return {
      id: payload.sub,
      refreshToken: req.cookies.refresh_token as string,
    };
  }
}
