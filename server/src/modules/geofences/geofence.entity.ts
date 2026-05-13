import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  GeofenceAppliesTo,
  GeofenceDirection,
  GeofenceShape,
} from "../../common/enums/geofence.enum.js";
import { User } from "../users/user.entity.js";

@Entity("geofence")
export class Geofence {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 80 })
  name: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  description: string | null;

  @Column({ type: "enum", enum: GeofenceShape })
  shape: GeofenceShape;

  @Column({
    type: "geometry",
    spatialFeatureType: "Polygon",
    srid: 4326,
    nullable: true,
  })
  geometry: string | null;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  circleCenter: string | null;

  @Column({ type: "integer", nullable: true })
  radiusMeters: number | null;

  @Column({ type: "enum", enum: GeofenceDirection })
  direction: GeofenceDirection;

  @Column({ type: "enum", enum: GeofenceAppliesTo })
  appliesTo: GeofenceAppliesTo;

  @Column({ type: "uuid", array: true, default: () => "'{}'" })
  vehicleIds: string[];

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "varchar", length: 9, default: "#3b82f6" })
  color: string;

  @Column({ type: "uuid" })
  createdById: string;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
