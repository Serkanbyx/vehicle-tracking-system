import {
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class LocationUpdatePayloadDto {
  @IsUUID("4")
  vehicleId: string;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(0)
  @Max(400)
  speed: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(359)
  heading?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}
