import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Alert } from "../alerts/alert.entity.js";
import { Trip } from "../trips/trip.entity.js";
import { User } from "../users/user.entity.js";
import { Vehicle } from "../vehicles/vehicle.entity.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([User, Vehicle, Alert, Trip])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
