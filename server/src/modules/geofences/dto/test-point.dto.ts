import { IsNumber, Max, Min } from "class-validator";

export class TestPointDto {
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;
}
