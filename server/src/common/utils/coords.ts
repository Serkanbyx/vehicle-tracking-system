import type { LngLat } from "./postgis-point";

/**
 * Type-guard that validates an unknown value is a valid { lng, lat } pair
 * within the WGS-84 coordinate bounds.
 *
 * Used by DTO validators and WebSocket gateway payload validators
 * to ensure coordinates are range-checked before reaching the DB.
 */
export const isValidLngLat = (p: unknown): p is LngLat => {
  if (typeof p !== "object" || p === null) return false;
  const o = p as Record<string, unknown>;
  const lng = o.lng;
  const lat = o.lat;
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};
