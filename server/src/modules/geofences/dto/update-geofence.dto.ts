import { PartialType } from "@nestjs/mapped-types";
import { CreateGeofenceDto } from "./create-geofence.dto.js";

export class UpdateGeofenceDto extends PartialType(CreateGeofenceDto) {}
