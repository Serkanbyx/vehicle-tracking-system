import { ArrayMinSize, Equals, IsArray } from "class-validator";

export class PolygonGeometryDto {
  @Equals("Polygon")
  type: string;

  @IsArray()
  @ArrayMinSize(1)
  coordinates: [number, number][][];
}
