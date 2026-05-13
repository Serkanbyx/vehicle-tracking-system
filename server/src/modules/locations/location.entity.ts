import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vehicle } from "../vehicles/vehicle.entity.js";

@Entity("location")
export class Location {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @PrimaryColumn({ type: "timestamptz", default: () => "now()" })
  timestamp: Date;

  @Column({ type: "uuid" })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @Column({ type: "geometry", spatialFeatureType: "Point", srid: 4326 })
  geom: string;

  @Column({ type: "numeric", precision: 5, scale: 2 })
  speed: number;

  @Column({ type: "smallint", nullable: true })
  heading: number | null;

  @Column({ type: "numeric", precision: 7, scale: 2, nullable: true })
  altitude: number | null;

  @Column({ type: "numeric", precision: 6, scale: 2, nullable: true })
  accuracy: number | null;

  @Column({ type: "varchar", length: 16, default: "device" })
  source: "device" | "simulator" | "manual";
}
