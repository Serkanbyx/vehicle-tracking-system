import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AlertSeverity, AlertType } from "../../common/enums/alert.enum.js";
import { Geofence } from "../geofences/geofence.entity.js";
import { User } from "../users/user.entity.js";
import { Vehicle } from "../vehicles/vehicle.entity.js";

@Entity("alert")
@Index("alert_vehicle_created_idx", ["vehicleId", "createdAt"])
@Index("alert_ack_created_idx", ["acknowledged", "createdAt"])
@Index("alert_type_idx", ["type"])
export class Alert {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @Column({ type: "enum", enum: AlertType })
  type: AlertType;

  @Column({
    type: "enum",
    enum: AlertSeverity,
    default: AlertSeverity.WARNING,
  })
  severity: AlertSeverity;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
  })
  geom: string;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true })
  speed: number | null;

  @Column({ type: "uuid", nullable: true })
  geofenceId: string | null;

  @ManyToOne(() => Geofence, { onDelete: "SET NULL" })
  @JoinColumn({ name: "geofenceId" })
  geofence: Geofence;

  @Column({ type: "boolean", default: false })
  acknowledged: boolean;

  @Column({ type: "uuid", nullable: true })
  acknowledgedById: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "acknowledgedById" })
  acknowledgedBy: User;

  @Column({ type: "timestamptz", nullable: true })
  acknowledgedAt: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
