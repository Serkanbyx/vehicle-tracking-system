import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "../../common/enums/user-role.enum.js";
import type { UserPreferencesDto } from "./dto/user-preferences.dto.js";

@Entity("user")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 60 })
  name: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 120 })
  email: string;

  @Column({ type: "varchar", length: 72, select: false })
  password: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Column({ type: "text", nullable: true })
  avatarUrl: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone: string | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: "varchar", length: 120, nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ type: "jsonb", default: () => "'{}'" })
  preferences: UserPreferencesDto;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
