import type { UserRole } from "../enums/user-role.enum.js";

/** Populated on HTTP requests by JwtStrategy (`validate`). */
export interface RequestUser {
  id: string;
  role: UserRole;
  email: string;
}
