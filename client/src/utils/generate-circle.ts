import type { Position } from "geojson";

const EARTH_RADIUS_M = 6_371_008.8;

/**
 * Generates a GeoJSON-compatible polygon ring that approximates a circle.
 * Uses the Haversine destination formula to compute each vertex.
 */
export function generateCircleCoords(
  center: [number, number],
  radiusMeters: number,
  segments = 64,
): Position[] {
  const [lng, lat] = center;
  const distRad = radiusMeters / EARTH_RADIUS_M;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const coords: Position[] = [];

  for (let i = 0; i <= segments; i++) {
    const bearing = (2 * Math.PI * i) / segments;
    const destLat = Math.asin(
      Math.sin(latRad) * Math.cos(distRad) +
        Math.cos(latRad) * Math.sin(distRad) * Math.cos(bearing),
    );
    const destLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distRad) * Math.cos(latRad),
        Math.cos(distRad) - Math.sin(latRad) * Math.sin(destLat),
      );
    coords.push([
      (destLng * 180) / Math.PI,
      (destLat * 180) / Math.PI,
    ]);
  }

  return coords;
}

/** Haversine distance between two [lng, lat] points in meters */
export function haversineDistance(
  a: [number, number],
  b: [number, number],
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
