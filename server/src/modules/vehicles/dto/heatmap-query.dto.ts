import {
  IsISO8601,
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator";

const MAX_RANGE_DAYS = 30;

@ValidatorConstraint({ name: "maxHeatmapRange", async: false })
class MaxHeatmapRangeConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as HeatmapQueryDto;
    if (!obj.from || !obj.to) return true;

    const diffMs = new Date(obj.to).getTime() - new Date(obj.from).getTime();

    return diffMs <= MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  }

  defaultMessage(): string {
    return `Date range must not exceed ${MAX_RANGE_DAYS} days`;
  }
}

export class HeatmapQueryDto {
  @IsISO8601()
  from: string;

  @IsISO8601()
  @Validate(MaxHeatmapRangeConstraint)
  to: string;
}
