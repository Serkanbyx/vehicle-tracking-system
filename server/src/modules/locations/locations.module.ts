import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Location } from "./location.entity.js";
import { LocationsService } from "./locations.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [LocationsService],
  exports: [LocationsService, TypeOrmModule],
})
export class LocationsModule {}
