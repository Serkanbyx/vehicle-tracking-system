/**
 * Sanity tests for geo-repo helper functions.
 *
 * These are **unit tests** that verify the generated SQL fragments and
 * parameter bindings without hitting a real database.  A full integration
 * run against PostGIS is planned in STEP 74.
 */
import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import {
  insertPointSql,
  lineLengthMeters,
  selectPointAsJson,
  whereCircleContains,
  whereContains,
  whereDWithin,
} from "../geo-repo.helper.js";

/* ------------------------------------------------------------------ */
/*  Minimal QueryBuilder stub                                          */
/* ------------------------------------------------------------------ */

const createMockQb = (): SelectQueryBuilder<ObjectLiteral> => {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {
    addSelect: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    setParameters: vi.fn().mockReturnThis(),
  };
  return qb as unknown as SelectQueryBuilder<ObjectLiteral>;
};

/* ------------------------------------------------------------------ */
/*  selectPointAsJson                                                  */
/* ------------------------------------------------------------------ */

describe("selectPointAsJson", () => {
  it("should add ST_AsGeoJSON select expression", () => {
    const qb = createMockQb();
    selectPointAsJson(qb, "vehicle.location", "locationJson");

    expect(qb.addSelect).toHaveBeenCalledWith("ST_AsGeoJSON(vehicle.location)", "locationJson");
  });
});

/* ------------------------------------------------------------------ */
/*  whereDWithin                                                       */
/* ------------------------------------------------------------------ */

describe("whereDWithin", () => {
  it("should add geography distance predicate with default prefix", () => {
    const qb = createMockQb();
    const point = { lng: 29.0, lat: 41.0 };

    whereDWithin(qb, "v.location", point, 5000);

    const [sql, params] = qb.andWhere.mock.calls[0];
    expect(sql).toContain("ST_DWithin");
    expect(sql).toContain("v.location::geography");
    expect(sql).toContain(":dw_lng");
    expect(sql).toContain(":dw_lat");
    expect(sql).toContain(":dw_meters");
    expect(params).toEqual({ dw_lng: 29.0, dw_lat: 41.0, dw_meters: 5000 });
  });

  it("should use custom param prefix to avoid collisions", () => {
    const qb = createMockQb();
    whereDWithin(qb, "v.location", { lng: 10, lat: 20 }, 100, "nearby");

    const [, params] = qb.andWhere.mock.calls[0];
    expect(params).toEqual({
      nearby_lng: 10,
      nearby_lat: 20,
      nearby_meters: 100,
    });
  });
});

/* ------------------------------------------------------------------ */
/*  whereContains                                                      */
/* ------------------------------------------------------------------ */

describe("whereContains", () => {
  it("should add ST_Contains predicate for polygon", () => {
    const qb = createMockQb();
    whereContains(qb, "g.polygon", { lng: 28.97, lat: 41.01 });

    const [sql, params] = qb.andWhere.mock.calls[0];
    expect(sql).toContain("ST_Contains(g.polygon");
    expect(sql).toContain("ST_SetSRID(ST_MakePoint(:ct_lng, :ct_lat), 4326)");
    expect(params).toEqual({ ct_lng: 28.97, ct_lat: 41.01 });
  });
});

/* ------------------------------------------------------------------ */
/*  whereCircleContains                                                */
/* ------------------------------------------------------------------ */

describe("whereCircleContains", () => {
  it("should add DWithin predicate with dynamic radius column", () => {
    const qb = createMockQb();
    whereCircleContains(qb, "g.center", "g.radius_meters", { lng: 29.5, lat: 40.5 });

    const [sql, params] = qb.andWhere.mock.calls[0];
    expect(sql).toContain("ST_DWithin(g.center::geography");
    expect(sql).toContain("g.radius_meters)");
    expect(params).toEqual({ cc_lng: 29.5, cc_lat: 40.5 });
  });
});

/* ------------------------------------------------------------------ */
/*  insertPointSql                                                     */
/* ------------------------------------------------------------------ */

describe("insertPointSql", () => {
  it("should return raw SQL expression and params with default prefix", () => {
    const { sql, params } = insertPointSql(29.0, 41.0);

    expect(sql).toBe("ST_SetSRID(ST_MakePoint(:ip_lng, :ip_lat), 4326)");
    expect(params).toEqual({ ip_lng: 29.0, ip_lat: 41.0 });
  });

  it("should respect custom param prefix", () => {
    const { sql, params } = insertPointSql(10, 20, "loc");

    expect(sql).toContain(":loc_lng");
    expect(sql).toContain(":loc_lat");
    expect(params).toEqual({ loc_lng: 10, loc_lat: 20 });
  });
});

/* ------------------------------------------------------------------ */
/*  lineLengthMeters                                                   */
/* ------------------------------------------------------------------ */

describe("lineLengthMeters", () => {
  it("should add ST_Length(ST_MakeLine(...)) select with default alias", () => {
    const qb = createMockQb();
    lineLengthMeters(qb, "loc");

    expect(qb.addSelect).toHaveBeenCalledWith(
      "ST_Length(ST_MakeLine(loc.geom ORDER BY loc.timestamp)::geography)",
      "distance_meters",
    );
  });

  it("should accept a custom alias", () => {
    const qb = createMockQb();
    lineLengthMeters(qb, "l", "trip_km");

    expect(qb.addSelect).toHaveBeenCalledWith(
      "ST_Length(ST_MakeLine(l.geom ORDER BY l.timestamp)::geography)",
      "trip_km",
    );
  });
});
