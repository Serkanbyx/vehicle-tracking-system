import { IsBoolean } from "class-validator";

export class AdminSetStatusDto {
  @IsBoolean()
  isActive: boolean;
}
