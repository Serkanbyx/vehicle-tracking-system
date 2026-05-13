import { Type } from "class-transformer";
import { IsInt, IsISO8601, IsNumber, IsOptional, Max, Min } from "class-validator";

export class HistoryQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20_000)
  limit?: number = 5000;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(400)
  minSpeed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(400)
  maxSpeed?: number;
}
