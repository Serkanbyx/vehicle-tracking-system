import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class LatestQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  count?: number = 10;
}
