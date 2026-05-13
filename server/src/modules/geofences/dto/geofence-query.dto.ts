import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { GeofenceShape } from "../../../common/enums/geofence.enum.js";

export class GeofenceQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(GeofenceShape)
  shape?: GeofenceShape;

  @IsOptional()
  @IsString()
  q?: string;
}
