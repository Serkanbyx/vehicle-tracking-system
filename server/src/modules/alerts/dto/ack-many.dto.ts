import { ArrayMaxSize, IsArray, IsUUID } from "class-validator";

export class AckManyDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  ids: string[];
}
