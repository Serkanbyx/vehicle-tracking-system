import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { VehicleType } from "../../../common/enums/vehicle-type.enum.js";
import { DriverDto } from "./driver.dto.js";

export class CreateVehicleDto {
  @IsString()
  @Matches(/^[A-Z0-9 -]{4,15}$/i, {
    message: "plate must be 4-15 alphanumeric characters, spaces or hyphens",
  })
  plate: string;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(new Date().getFullYear())
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ValidateNested()
  @Type(() => DriverDto)
  driver: DriverDto;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  photoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(250)
  speedLimitKmh?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID("4", { each: true })
  assignedManagers?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}
