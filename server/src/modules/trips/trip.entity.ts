import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TripStatus } from "../../common/enums/trip.enum.js";
import { Vehicle } from "../vehicles/vehicle.entity.js";

@Entity("trip")
@Index("trip_vehicle_started_idx", ["vehicleId", "startedAt"])
export class Trip {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @Column({ type: "timestamptz" })
  startedAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  endedAt: Date | null;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
  })
  startGeom: string;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  endGeom: string | null;

  @Column({ type: "numeric", precision: 8, scale: 2, nullable: true })
  distanceKm: number | null;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true })
  avgSpeedKmh: number | null;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true })
  maxSpeedKmh: number | null;

  @Column({ type: "int", default: 0 })
  speedViolations: number;

  @Column({ type: "int", default: 0 })
  idleEvents: number;

  @Column({ type: "int", default: 0 })
  geofenceEvents: number;

  @Column({ type: "int", default: 0 })
  pointCount: number;

  @Column({ type: "enum", enum: TripStatus, default: TripStatus.OPEN })
  status: TripStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
