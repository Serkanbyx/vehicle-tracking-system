import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Geofence } from "./geofence.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Geofence])],
  exports: [TypeOrmModule],
})
export class GeofencesModule {}
