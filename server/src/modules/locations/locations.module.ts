import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Location } from "./location.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  exports: [TypeOrmModule],
})
export class LocationsModule {}
