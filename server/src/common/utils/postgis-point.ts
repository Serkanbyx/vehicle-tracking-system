import type { ColumnOptions, ValueTransformer } from 'typeorm';

/**
 * Lightweight {longitude, latitude} representation used across the app.
 * DB column: geometry(Point, 4326)  ↔  TS: { lng, lat }
 */
export type LngLat = { lng: number; lat: number };

/**
 * Parses hex-EWKB (or WKT) geometry that Postgres returns for a Point column
 * into a plain { lng, lat } object.
 *
 * Strategy: PostGIS stores geometry as hex EWKB by default.
 * For a 2-D SRID-4326 point the hex string is always 50 chars:
 *   byte-order (1 byte) + type-with-srid flag (4 bytes) + srid (4 bytes)
 *   + X float64 (8 bytes) + Y float64 (8 bytes) = 25 bytes → 50 hex chars.
 *
 * Falls back to GeoJSON-string parsing for cases where the query explicitly
 * uses ST_AsGeoJSON.
 */
const parsePoint = (raw: unknown): LngLat | null => {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'object' && raw !== null && 'lng' in raw && 'lat' in raw) {
    return raw as LngLat;
  }

  if (typeof raw !== 'string') return null;

  // GeoJSON string (from ST_AsGeoJSON)
  if (raw.startsWith('{')) {
    try {
      const geo = JSON.parse(raw);
      if (geo?.type === 'Point' && Array.isArray(geo.coordinates)) {
        const [lng, lat] = geo.coordinates;
        return { lng, lat };
      }
    } catch {
      return null;
    }
  }

  // Hex EWKB — 2D Point with SRID flag is 50 hex chars
  if (/^[0-9a-fA-F]{50}$/.test(raw)) {
    try {
      const buf = Buffer.from(raw, 'hex');
      const littleEndian = buf.readUInt8(0) === 1;

      const readDouble = (offset: number) =>
        littleEndian ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset);

      const lng = readDouble(9);
      const lat = readDouble(17);
      return { lng, lat };
    } catch {
      return null;
    }
  }

  return null;
};

const pointTransformer: ValueTransformer = {
  /** DB → App: hex EWKB or GeoJSON string → { lng, lat } */
  from: (value: unknown): LngLat | null => parsePoint(value),

  /**
   * App → DB: pass-through.
   * Actual writes use parametrized ST_SetSRID(ST_MakePoint($1,$2), 4326)
   * at the repository level — the transformer does NOT attempt raw SQL.
   */
  to: (value: LngLat | null | undefined): LngLat | null | undefined => value,
};

/**
 * Reusable column options for a PostGIS Point(4326) column.
 *
 * Usage:
 * ```ts
 * @Column({ ...pointColumn() })
 * location: LngLat;
 * ```
 *
 * Reads are transformed automatically (hex EWKB → { lng, lat }).
 * Writes should go through repository helpers with parametrized ST_* functions.
 */
export const pointColumn = (nullable = true): ColumnOptions => ({
  type: 'geometry',
  spatialFeatureType: 'Point',
  srid: 4326,
  nullable,
  transformer: pointTransformer,
});
