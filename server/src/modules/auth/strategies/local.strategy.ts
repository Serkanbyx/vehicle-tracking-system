import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import type { User } from "../../users/user.entity.js";
import type { AuthService } from "../auth.service.js";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<Omit<User, "password">> {
    const user = await this.authService.validateCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }
}
