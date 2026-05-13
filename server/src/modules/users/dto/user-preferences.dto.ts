import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class MapDefaultsDto {
  @IsOptional()
  @IsNumber({}, { each: true })
  center?: [number, number];

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(18)
  zoom?: number;
}

export class NotificationsDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsIn(["info", "warning", "critical"])
  severityThreshold?: string;
}

export class UserPreferencesDto {
  @IsOptional()
  @IsIn(["light", "dark", "system"])
  theme?: string;

  @IsOptional()
  @IsIn(["sm", "md", "lg"])
  fontSize?: string;

  @IsOptional()
  @IsIn(["compact", "comfortable", "spacious"])
  contentDensity?: string;

  @IsOptional()
  @IsBoolean()
  animations?: boolean;

  @IsOptional()
  @IsIn(["en"])
  language?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationsDto)
  notifications?: NotificationsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MapDefaultsDto)
  mapDefaults?: MapDefaultsDto;
}

export const DEFAULT_PREFERENCES: UserPreferencesDto = {
  theme: "system",
  fontSize: "md",
  contentDensity: "comfortable",
  animations: true,
  language: "en",
  notifications: {
    email: true,
    inApp: true,
    severityThreshold: "warning",
  },
  mapDefaults: {
    center: [28.9784, 41.0082],
    zoom: 11,
  },
};
