import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync,
} from "class-validator";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @IsOptional()
  PORT: number = 5000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL: string = "15m";

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_TTL: string = "7d";

  @IsUrl({ require_tld: false })
  @IsOptional()
  CLIENT_URL: string = "http://localhost:3000";

  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET?: string;

  @IsString()
  @IsNotEmpty()
  SIMULATOR_API_KEY: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  SPEED_LIMIT_KMH: number = 90;

  @IsNumber()
  @Min(1)
  @IsOptional()
  IDLE_THRESHOLD_MIN: number = 10;

  @IsNumber()
  @Min(1)
  @IsOptional()
  TRIP_END_MIN: number = 5;

  @IsString()
  @IsOptional()
  ADMIN_EMAIL?: string;

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  ADMIN_NAME?: string;

  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  LOGTAIL_TOKEN?: string;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = "info";
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => Object.values(err.constraints ?? {}).join(", "))
      .join("\n  • ");
    throw new Error(`\nEnvironment validation failed:\n  • ${messages}\n`);
  }

  const isProduction = validated.NODE_ENV === Environment.Production;

  if (isProduction) {
    const prodErrors: string[] = [];

    if (validated.JWT_ACCESS_SECRET.length < 32) {
      prodErrors.push("JWT_ACCESS_SECRET must be at least 32 characters");
    }
    if (validated.JWT_REFRESH_SECRET.length < 32) {
      prodErrors.push("JWT_REFRESH_SECRET must be at least 32 characters");
    }
    if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
      prodErrors.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
    }
    if (!validated.CLOUDINARY_CLOUD_NAME) {
      prodErrors.push("CLOUDINARY_CLOUD_NAME is required in production");
    }
    if (!validated.CLOUDINARY_API_KEY) {
      prodErrors.push("CLOUDINARY_API_KEY is required in production");
    }
    if (!validated.CLOUDINARY_API_SECRET) {
      prodErrors.push("CLOUDINARY_API_SECRET is required in production");
    }

    if (prodErrors.length > 0) {
      const joined = prodErrors.join("\n  • ");
      throw new Error(`\nProduction environment validation failed:\n  • ${joined}\n`);
    }
  }

  if (validated.SIMULATOR_API_KEY.length < 32) {
    throw new Error("SIMULATOR_API_KEY must be at least 32 characters");
  }

  return validated;
}
