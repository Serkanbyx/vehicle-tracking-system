import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator.js";
import { SimulatorKeyGuard } from "../../common/guards/simulator-key.guard.js";
import { LocationIngestionService } from "../realtime/location-ingestion.service.js";
import type {
  HistoryQueryDto,
  LatestQueryDto,
  LocationIngestDto,
  StatsQueryDto,
} from "./dto/index.js";
import { LocationsService } from "./locations.service.js";

@Controller("vehicles/:vehicleId")
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly ingestionService: LocationIngestionService,
  ) {}

  @Get("history")
  async getHistory(
    @Param("vehicleId", ParseUUIDPipe) vehicleId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.locationsService.getHistory(vehicleId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit,
      minSpeed: query.minSpeed,
      maxSpeed: query.maxSpeed,
    });
  }

  @Get("locations/latest")
  async getLatest(
    @Param("vehicleId", ParseUUIDPipe) vehicleId: string,
    @Query() query: LatestQueryDto,
  ) {
    return this.locationsService.getLatest(vehicleId, query.count);
  }

  @Get("stats")
  async getStats(
    @Param("vehicleId", ParseUUIDPipe) vehicleId: string,
    @Query() query: StatsQueryDto,
  ) {
    return this.locationsService.getStats(vehicleId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Public()
  @UseGuards(SimulatorKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post("locations")
  async ingestHttpFallback(
    @Param("vehicleId", ParseUUIDPipe) vehicleId: string,
    @Body() dto: LocationIngestDto,
  ) {
    await this.ingestionService.handle({
      vehicleId,
      lng: dto.lng,
      lat: dto.lat,
      speed: dto.speed,
      heading: dto.heading,
      altitude: dto.altitude,
      accuracy: dto.accuracy,
      source: "device",
      timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
    });
  }
}
