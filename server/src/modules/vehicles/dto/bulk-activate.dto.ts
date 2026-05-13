import { ArrayMaxSize, IsArray, IsBoolean, IsUUID } from "class-validator";

export class BulkActivateDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID("4", { each: true })
  ids: string[];

  @IsBoolean()
  isActive: boolean;
}
