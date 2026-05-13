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
import {
  HistoryQueryDto,
  LatestQueryDto,
  LocationIngestDto,
  StatsQueryDto,
} from "./dto/index.js";
import { LocationIngestionService } from "../realtime/location-ingestion.service.js";
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
    const points = await this.locationsService.getHistory(vehicleId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit,
      minSpeed: query.minSpeed,
      maxSpeed: query.maxSpeed,
    });

    return { success: true, data: points };
  }

  @Get("locations/latest")
  async getLatest(
    @Param("vehicleId", ParseUUIDPipe) vehicleId: string,
    @Query() query: LatestQueryDto,
  ) {
    const points = await this.locationsService.getLatest(
      vehicleId,
      query.count,
    );

    return { success: true, data: points };
  }

  @Get("stats")
  async getStats(
    @Param("vehicleId", ParseUUIDPipe) vehicleId: string,
    @Query() query: StatsQueryDto,
  ) {
    const stats = await this.locationsService.getStats(vehicleId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    return { success: true, data: stats };
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

    return { success: true, data: null };
  }
}
