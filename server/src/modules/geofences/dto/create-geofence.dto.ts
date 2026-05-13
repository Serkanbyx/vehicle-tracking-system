import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import {
  GeofenceAppliesTo,
  GeofenceDirection,
  GeofenceShape,
} from "../../../common/enums/geofence.enum.js";
import { CircleCenterDto } from "./circle-center.dto.js";
import { PolygonGeometryDto } from "./polygon-geometry.dto.js";

export class CreateGeofenceDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsEnum(GeofenceShape)
  shape: GeofenceShape;

  @IsOptional()
  @ValidateNested()
  @Type(() => PolygonGeometryDto)
  geometry?: PolygonGeometryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CircleCenterDto)
  circleCenter?: CircleCenterDto;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100_000)
  radiusMeters?: number;

  @IsEnum(GeofenceDirection)
  direction: GeofenceDirection;

  @IsEnum(GeofenceAppliesTo)
  appliesTo: GeofenceAppliesTo;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID("4", { each: true })
  vehicleIds?: string[];

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "color must be a valid hex code" })
  color?: string;
}
