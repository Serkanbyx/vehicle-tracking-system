import type { LngLat } from './postgis-point';

/**
 * Type-guard that validates an unknown value is a valid { lng, lat } pair
 * within the WGS-84 coordinate bounds.
 *
 * Used by DTO validators and WebSocket gateway payload validators
 * to ensure coordinates are range-checked before reaching the DB.
 */
export const isValidLngLat = (p: unknown): p is LngLat =>
  typeof (p as any)?.lng === 'number' &&
  typeof (p as any)?.lat === 'number' &&
  (p as any).lng >= -180 &&
  (p as any).lng <= 180 &&
  (p as any).lat >= -90 &&
  (p as any).lat <= 90;
