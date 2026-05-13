import { IsISO8601, IsOptional, IsUUID } from "class-validator";

export class TripSummaryQueryDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;
}
