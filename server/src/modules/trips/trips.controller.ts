import { Controller, Get, Header, Param, ParseUUIDPipe, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { TripExportQueryDto, TripQueryDto, TripSummaryQueryDto } from "./dto/index.js";
import { TripsService } from "./trips.service.js";

@ApiTags("Trips")
@ApiBearerAuth("JWT")
@Controller("trips")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findAll(@Query() query: TripQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get("summary")
  async dailySummary(@Query() query: TripSummaryQueryDto) {
    return this.tripsService.dailySummary(query);
  }

  @Throttle({ export: {} })
  @Get("export")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="trips.csv"')
  async exportCsv(@Query() query: TripExportQueryDto, @Res() res: Response) {
    const csv = await this.tripsService.exportCsv(query);

    res.send(csv);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.tripsService.findOne(id);
  }
}
