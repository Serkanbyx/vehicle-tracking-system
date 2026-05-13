import type { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import type { LngLat } from './postgis-point';

/* ------------------------------------------------------------------ */
/*  selectPointAsJson                                                  */
/* ------------------------------------------------------------------ */

/**
 * Adds `ST_AsGeoJSON(column) AS alias` to the query's SELECT list.
 * Useful when the caller wants a JSON representation of a geometry column
 * rather than the raw hex-EWKB that Postgres returns by default.
 */
export const selectPointAsJson = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  column: string,
  alias: string,
): SelectQueryBuilder<T> =>
  qb.addSelect(`ST_AsGeoJSON(${column})`, alias);

/* ------------------------------------------------------------------ */
/*  whereDWithin                                                       */
/* ------------------------------------------------------------------ */

/**
 * Appends an `ST_DWithin` predicate — geography-cast distance check in meters.
 *
 * ```sql
 * ST_DWithin(column::geography,
 *   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :meters)
 * ```
 *
 * @param paramPrefix  Unique prefix to avoid param-name collisions when the
 *                     same helper is used more than once in a query.
 */
export const whereDWithin = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  column: string,
  point: LngLat,
  meters: number,
  paramPrefix = 'dw',
): SelectQueryBuilder<T> =>
  qb.andWhere(
    `ST_DWithin(${column}::geography, ` +
      `ST_SetSRID(ST_MakePoint(:${paramPrefix}_lng, :${paramPrefix}_lat), 4326)::geography, ` +
      `:${paramPrefix}_meters)`,
    {
      [`${paramPrefix}_lng`]: point.lng,
      [`${paramPrefix}_lat`]: point.lat,
      [`${paramPrefix}_meters`]: meters,
    },
  );

/* ------------------------------------------------------------------ */
/*  whereContains                                                      */
/* ------------------------------------------------------------------ */

/**
 * Appends an `ST_Contains` predicate — checks whether a polygon column
 * contains the given point (geometry comparison, not geography).
 */
export const whereContains = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  polygonCol: string,
  point: LngLat,
  paramPrefix = 'ct',
): SelectQueryBuilder<T> =>
  qb.andWhere(
    `ST_Contains(${polygonCol}, ` +
      `ST_SetSRID(ST_MakePoint(:${paramPrefix}_lng, :${paramPrefix}_lat), 4326))`,
    {
      [`${paramPrefix}_lng`]: point.lng,
      [`${paramPrefix}_lat`]: point.lat,
    },
  );

/* ------------------------------------------------------------------ */
/*  whereCircleContains                                                */
/* ------------------------------------------------------------------ */

/**
 * Appends a circle-geofence predicate using `ST_DWithin` with a dynamic radius
 * column. Both center and point are cast to geography for meter-accurate distance.
 *
 * ```sql
 * ST_DWithin(centerCol::geography,
 *   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, radiusCol)
 * ```
 */
export const whereCircleContains = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  centerCol: string,
  radiusCol: string,
  point: LngLat,
  paramPrefix = 'cc',
): SelectQueryBuilder<T> =>
  qb.andWhere(
    `ST_DWithin(${centerCol}::geography, ` +
      `ST_SetSRID(ST_MakePoint(:${paramPrefix}_lng, :${paramPrefix}_lat), 4326)::geography, ` +
      `${radiusCol})`,
    {
      [`${paramPrefix}_lng`]: point.lng,
      [`${paramPrefix}_lat`]: point.lat,
    },
  );

/* ------------------------------------------------------------------ */
/*  insertPointSql                                                     */
/* ------------------------------------------------------------------ */

/**
 * Returns a raw SQL expression + parameter map for inserting a Point geometry.
 * Designed to be spread into `QueryBuilder.values()` or `.set()` calls.
 *
 * ```ts
 * const { sql, params } = insertPointSql(29.0, 41.0, 'ins');
 * qb.set({ location: () => sql }).setParameters(params);
 * ```
 */
export const insertPointSql = (
  lng: number,
  lat: number,
  paramPrefix = 'ip',
): { sql: string; params: Record<string, number> } => ({
  sql: `ST_SetSRID(ST_MakePoint(:${paramPrefix}_lng, :${paramPrefix}_lat), 4326)`,
  params: {
    [`${paramPrefix}_lng`]: lng,
    [`${paramPrefix}_lat`]: lat,
  },
});

/* ------------------------------------------------------------------ */
/*  lineLengthMeters                                                   */
/* ------------------------------------------------------------------ */

/**
 * Adds a `SELECT` expression that computes the total line length (in meters)
 * by building an `ST_MakeLine` from ordered points, cast to geography.
 *
 * ```sql
 * ST_Length(
 *   ST_MakeLine(locTable.geom ORDER BY locTable.timestamp)::geography
 * )
 * ```
 *
 * @param locTable  Table alias for the location table.
 * @param alias     Column alias for the result (default `"distance_meters"`).
 */
export const lineLengthMeters = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  locTable: string,
  alias = 'distance_meters',
): SelectQueryBuilder<T> =>
  qb.addSelect(
    `ST_Length(ST_MakeLine(${locTable}.geom ORDER BY ${locTable}.timestamp)::geography)`,
    alias,
  );
