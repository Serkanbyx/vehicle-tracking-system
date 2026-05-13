import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExportService } from "../../common/utils/export.service.js";
import { LocationsModule } from "../locations/locations.module.js";
import { Vehicle } from "./vehicle.entity.js";
import { VehiclesController } from "./vehicles.controller.js";
import { VehiclesService } from "./vehicles.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle]), LocationsModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, ExportService],
  exports: [VehiclesService, TypeOrmModule],
})
export class VehiclesModule {}
