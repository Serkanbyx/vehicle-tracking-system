import { Injectable } from "@nestjs/common";
import type { LocationPoint } from "../../modules/locations/locations.service.js";

const FORMULA_CHARS = new Set(["=", "+", "-", "@"]);

@Injectable()
export class ExportService {
  locationsToCsv(rows: LocationPoint[]): string {
    const header = "id,vehicleId,lng,lat,speed,heading,altitude,accuracy,source,timestamp";
    const csvRows = rows.map((r) =>
      [
        this.escapeCell(r.id),
        this.escapeCell(r.vehicleId),
        r.lng,
        r.lat,
        r.speed,
        r.heading ?? "",
        r.altitude ?? "",
        r.accuracy ?? "",
        this.escapeCell(r.source),
        this.escapeCell(
          r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
        ),
      ].join(","),
    );

    return [header, ...csvRows].join("\n");
  }

  locationsToGeoJson(rows: LocationPoint[], vehicle: { id: string; plate: string }): object {
    const coordinates = rows.map((r) => [r.lng, r.lat]);

    const lineFeature = {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates,
      },
      properties: {
        vehicleId: vehicle.id,
        plate: vehicle.plate,
        from: rows.length > 0 ? rows[0].timestamp : null,
        to: rows.length > 0 ? rows[rows.length - 1].timestamp : null,
      },
    };

    const pointFeatures = rows.map((r) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [r.lng, r.lat],
      },
      properties: {
        speed: r.speed,
        heading: r.heading,
        timestamp: r.timestamp,
      },
    }));

    return {
      type: "FeatureCollection",
      features: [lineFeature, ...pointFeatures],
    };
  }

  tripsToCsv(
    trips: {
      id: string;
      vehicleId: string;
      plate?: string;
      status: string;
      startedAt: Date | string | null;
      endedAt: Date | string | null;
      distanceKm: number | null;
      avgSpeedKmh: number | null;
      maxSpeedKmh: number | null;
      speedViolations: number;
      idleEvents: number;
      geofenceEvents: number;
      pointCount: number;
    }[],
  ): string {
    const header =
      "id,vehicleId,plate,status,startedAt,endedAt,distanceKm,avgSpeedKmh,maxSpeedKmh,speedViolations,idleEvents,geofenceEvents,pointCount";

    const csvRows = trips.map((t) =>
      [
        this.escapeCell(t.id),
        this.escapeCell(t.vehicleId),
        this.escapeCell(t.plate ?? ""),
        this.escapeCell(t.status),
        this.escapeCell(this.toIso(t.startedAt)),
        this.escapeCell(this.toIso(t.endedAt)),
        t.distanceKm ?? "",
        t.avgSpeedKmh ?? "",
        t.maxSpeedKmh ?? "",
        t.speedViolations,
        t.idleEvents,
        t.geofenceEvents,
        t.pointCount,
      ].join(","),
    );

    return [header, ...csvRows].join("\n");
  }

  private escapeCell(value: string): string {
    if (!value) return value;

    let escaped = value;

    if (FORMULA_CHARS.has(escaped[0])) {
      escaped = `'${escaped}`;
    }

    if (/[,"\n\r]/.test(escaped)) {
      escaped = `"${escaped.replace(/"/g, '""')}"`;
    }

    return escaped;
  }

  private toIso(val: Date | string | null): string {
    if (!val) return "";
    return val instanceof Date ? val.toISOString() : String(val);
  }
}
