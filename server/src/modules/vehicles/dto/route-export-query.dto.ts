import { IsEnum, IsISO8601, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

export enum ExportFormat {
  CSV = "csv",
  GEOJSON = "geojson",
}

const MAX_RANGE_DAYS = 90;

@ValidatorConstraint({ name: "maxDateRange", async: false })
class MaxDateRangeConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as RouteExportQueryDto;
    if (!obj.from || !obj.to) return true;

    const diffMs =
      new Date(obj.to).getTime() - new Date(obj.from).getTime();

    return diffMs <= MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  }

  defaultMessage(): string {
    return `Date range must not exceed ${MAX_RANGE_DAYS} days`;
  }
}

export class RouteExportQueryDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsISO8601()
  from: string;

  @IsISO8601()
  @Validate(MaxDateRangeConstraint)
  to: string;
}
