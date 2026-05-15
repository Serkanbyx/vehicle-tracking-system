import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { UserRole } from "../../src/common/enums/user-role.enum";
import { closeTestApp, createTestApp, loginAsTestUser, truncateAll } from "./helpers";

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

/* Istanbul square (approximate polygon) */
const istanbulPolygon = {
  type: "Polygon",
  coordinates: [
    [
      [28.97, 41.01],
      [28.98, 41.01],
      [28.98, 41.02],
      [28.97, 41.02],
      [28.97, 41.01],
    ],
  ],
};

describe("Geofences E2E — Polygon + Circle + Test Point", () => {
  it("Create polygon geofence → test point inside → true", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);
    const server = app.getHttpServer();

    /* ── Create polygon geofence ── */
    const createRes = await request(server)
      .post("/api/geofences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Istanbul Square",
        shape: "polygon",
        geometry: istanbulPolygon,
        direction: "enter",
        appliesTo: "all",
      })
      .expect(201);

    const geofenceId = createRes.body.data.id;
    expect(geofenceId).toBeDefined();

    /* ── Test point inside polygon → true ── */
    const insideRes = await request(server)
      .post(`/api/geofences/${geofenceId}/test`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lng: 28.975, lat: 41.015 })
      .expect(200);

    expect(insideRes.body.data.inside).toBe(true);

    /* ── Test point outside polygon → false ── */
    const outsideRes = await request(server)
      .post(`/api/geofences/${geofenceId}/test`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lng: 30.0, lat: 42.0 })
      .expect(200);

    expect(outsideRes.body.data.inside).toBe(false);
  });

  it("Create circle geofence → test point in radius → true", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);
    const server = app.getHttpServer();

    /* ── Create circle geofence (center: Istanbul, radius: 5km) ── */
    const createRes = await request(server)
      .post("/api/geofences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Istanbul Circle",
        shape: "circle",
        circleCenter: { lng: 29.0, lat: 41.0 },
        radiusMeters: 5000,
        direction: "both",
        appliesTo: "all",
      })
      .expect(201);

    const geofenceId = createRes.body.data.id;
    expect(geofenceId).toBeDefined();

    /* ── Test point near center (within 5km) → true ── */
    const nearRes = await request(server)
      .post(`/api/geofences/${geofenceId}/test`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lng: 29.001, lat: 41.001 })
      .expect(200);

    expect(nearRes.body.data.inside).toBe(true);

    /* ── Test point far away → false ── */
    const farRes = await request(server)
      .post(`/api/geofences/${geofenceId}/test`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lng: 35.0, lat: 45.0 })
      .expect(200);

    expect(farRes.body.data.inside).toBe(false);
  });

  it("Viewer cannot create geofences", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.VIEWER);

    await request(app.getHttpServer())
      .post("/api/geofences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Blocked",
        shape: "polygon",
        geometry: istanbulPolygon,
        direction: "enter",
        appliesTo: "all",
      })
      .expect(403);
  });
});
