import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Geofence } from "./geofence.entity.js";
import { GeofencesController } from "./geofences.controller.js";
import { GeofencesService } from "./geofences.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Geofence])],
  controllers: [GeofencesController],
  providers: [GeofencesService],
  exports: [GeofencesService, TypeOrmModule],
})
export class GeofencesModule {}
