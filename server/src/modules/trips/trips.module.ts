import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Trip } from "./trip.entity.js";
import { TripAggregatorService } from "./trip-aggregator.service.js";
import { TripsController } from "./trips.controller.js";
import { TripsService } from "./trips.service.js";

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot(), TypeOrmModule.forFeature([Trip])],
  controllers: [TripsController],
  providers: [TripsService, TripAggregatorService],
  exports: [TripsService, TripAggregatorService, TypeOrmModule],
})
export class TripsModule {}
