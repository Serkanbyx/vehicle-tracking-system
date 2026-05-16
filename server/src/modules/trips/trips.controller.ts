import { Controller, Get, Header, Param, ParseUUIDPipe, Query, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import type { TripExportQueryDto, TripQueryDto, TripSummaryQueryDto } from "./dto/index.js";
import { TripsService } from "./trips.service.js";

@Controller("trips")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findAll(@Query() query: TripQueryDto) {
    const result = await this.tripsService.findAll(query);

    return { success: true, data: result };
  }

  @Get("summary")
  async dailySummary(@Query() query: TripSummaryQueryDto) {
    const result = await this.tripsService.dailySummary(query);

    return { success: true, data: result };
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
    const trip = await this.tripsService.findOne(id);

    return { success: true, data: trip };
  }
}
