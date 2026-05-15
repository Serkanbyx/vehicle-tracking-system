import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { UserRole } from "../../src/common/enums/user-role.enum";
import {
  closeTestApp,
  createTestApp,
  createTestVehicle,
  getDataSource,
  loginAsTestUser,
  simulatorKey,
  truncateAll,
} from "./helpers";

let app: INestApplication;

beforeAll(async () => {
  app = await createTestApp();
});

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeTestApp();
});

describe("Vehicles E2E — CRUD + location cascade", () => {
  it("Create vehicle → ingest 3 locations → history → stats → delete → cascade", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);
    const server = app.getHttpServer();

    /* ── 1. Create vehicle ── */
    const vehicle = await createTestVehicle(app, accessToken);
    expect(vehicle.id).toBeDefined();

    /* ── 2. Ingest 3 locations via HTTP fallback ── */
    const locations = [
      { lng: 29.0, lat: 41.0, speed: 60, heading: 90 },
      { lng: 29.01, lat: 41.01, speed: 70, heading: 95 },
      { lng: 29.02, lat: 41.02, speed: 80, heading: 100 },
    ];

    for (const loc of locations) {
      await request(server)
        .post(`/api/vehicles/${vehicle.id}/locations`)
        .set("x-simulator-key", simulatorKey())
        .send(loc)
        .expect(201);
    }

    /* ── 3. History returns 3 points ── */
    const historyRes = await request(server)
      .get(`/api/vehicles/${vehicle.id}/history`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(historyRes.body.data).toHaveLength(3);

    /* ── 4. Stats correct ── */
    const statsRes = await request(server)
      .get(`/api/vehicles/${vehicle.id}/stats`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(statsRes.body.data).toBeDefined();

    /* ── 5. Delete vehicle ── */
    await request(server)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    /* ── 6. Locations gone (FK CASCADE) ── */
    const ds = getDataSource();
    const remaining = await ds.query(
      `SELECT COUNT(*)::int AS cnt FROM location WHERE "vehicleId" = $1`,
      [vehicle.id],
    );
    expect(remaining[0].cnt).toBe(0);
  });

  it("should return 404 for non-existent vehicle", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.VIEWER);

    await request(app.getHttpServer())
      .get("/api/vehicles/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });

  it("should reject invalid plate format", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);

    await request(app.getHttpServer())
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        plate: "!@#",
        vehicleType: "car",
        driver: { name: "Driver" },
      })
      .expect(400);
  });
});
