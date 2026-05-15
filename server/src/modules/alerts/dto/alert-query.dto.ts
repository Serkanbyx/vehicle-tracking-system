import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsUUID, Max, Min } from "class-validator";
import { AlertSeverity, AlertType } from "../../../common/enums/alert.enum.js";

export class AlertQueryDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  acknowledged?: boolean;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
