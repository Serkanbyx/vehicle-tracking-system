import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { VehicleType } from "../../common/enums/vehicle-type.enum.js";
import { User } from "../users/user.entity.js";

export interface VehicleDriver {
  name?: string;
  phone?: string;
  photoUrl?: string;
  licenseNumber?: string;
}

export interface VehicleLastLocation {
  lng: number;
  lat: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: "moving" | "idle" | "offline";
}

@Entity("vehicle")
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("vehicle_plate_unique_idx", { unique: true })
  @Column({ type: "varchar", length: 15 })
  plate: string;

  @Column({ type: "enum", enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ type: "varchar", length: 80, nullable: true })
  model: string | null;

  @Column({ type: "smallint", nullable: true })
  year: number | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  color: string | null;

  @Column({ type: "jsonb", default: () => "'{}'" })
  driver: VehicleDriver;

  @Column({ type: "text", nullable: true })
  photoUrl: string | null;

  @Column({ type: "smallint", default: 90 })
  speedLimitKmh: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "jsonb", nullable: true })
  lastLocation: VehicleLastLocation | null;

  @Column({ type: "uuid", array: true, default: () => "'{}'" })
  assignedManagers: string[];

  @Column({ type: "uuid" })
  createdById: string;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column({ type: "varchar", length: 30, array: true, default: () => "'{}'" })
  tags: string[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizePlate() {
    if (this.plate) {
      this.plate = this.plate.trim().toUpperCase();
    }
  }
}
