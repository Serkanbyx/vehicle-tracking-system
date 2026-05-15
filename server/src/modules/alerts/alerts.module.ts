import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeofencesModule } from "../geofences/geofences.module.js";
import { RealtimeModule } from "../realtime/realtime.module.js";
import { Alert } from "./alert.entity.js";
import { AlertEngineService } from "./alert-engine.service.js";
import { AlertsController } from "./alerts.controller.js";
import { AlertsService } from "./alerts.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), GeofencesModule, forwardRef(() => RealtimeModule)],
  controllers: [AlertsController],
  providers: [AlertsService, AlertEngineService],
  exports: [AlertsService, AlertEngineService, TypeOrmModule],
})
export class AlertsModule {}
