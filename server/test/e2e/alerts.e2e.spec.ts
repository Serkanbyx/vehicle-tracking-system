import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { UserRole } from "../../src/common/enums/user-role.enum";
import {
  createTestApp,
  closeTestApp,
  truncateAll,
  loginAsTestUser,
  createTestVehicle,
  simulatorKey,
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

describe("Alerts E2E — Speed trigger + ack + debounce", () => {
  it("Trigger speed alert via ingest → listed → ack → audit fields updated", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);
    const vehicle = await createTestVehicle(app, accessToken);
    const server = app.getHttpServer();

    /* ── 1. Ingest high-speed location to trigger alert ── */
    await request(server)
      .post(`/api/vehicles/${vehicle.id}/locations`)
      .set("x-simulator-key", simulatorKey())
      .send({ lng: 29.0, lat: 41.0, speed: 150, heading: 0 })
      .expect(201);

    /* ── 2. List alerts — should include the speed alert ── */
    const listRes = await request(server)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ vehicleId: vehicle.id })
      .expect(200);

    expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);

    const speedAlert = listRes.body.data.items.find(
      (a: any) => a.type === "speed",
    );
    expect(speedAlert).toBeDefined();
    expect(speedAlert.acknowledged).toBe(false);

    /* ── 3. Acknowledge the alert ── */
    const ackRes = await request(server)
      .post(`/api/alerts/${speedAlert.id}/ack`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(ackRes.body.data.acknowledged).toBe(true);
    expect(ackRes.body.data.acknowledgedById).toBeDefined();
    expect(ackRes.body.data.acknowledgedAt).toBeDefined();
  });

  it("Debounce blocks second speed alert within 60s", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);
    const vehicle = await createTestVehicle(app, accessToken);
    const server = app.getHttpServer();

    /* ── First ingest — triggers alert ── */
    await request(server)
      .post(`/api/vehicles/${vehicle.id}/locations`)
      .set("x-simulator-key", simulatorKey())
      .send({ lng: 29.0, lat: 41.0, speed: 150, heading: 0 })
      .expect(201);

    /* ── Second ingest — debounced, no new alert ── */
    await request(server)
      .post(`/api/vehicles/${vehicle.id}/locations`)
      .set("x-simulator-key", simulatorKey())
      .send({ lng: 29.01, lat: 41.01, speed: 160, heading: 0 })
      .expect(201);

    const listRes = await request(server)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ vehicleId: vehicle.id, type: "speed" })
      .expect(200);

    expect(listRes.body.data.items).toHaveLength(1);
  });

  it("Viewer cannot acknowledge alerts", async () => {
    const { accessToken: managerToken } = await loginAsTestUser(
      app,
      UserRole.MANAGER,
    );
    const vehicle = await createTestVehicle(app, managerToken);
    const server = app.getHttpServer();

    await request(server)
      .post(`/api/vehicles/${vehicle.id}/locations`)
      .set("x-simulator-key", simulatorKey())
      .send({ lng: 29.0, lat: 41.0, speed: 150, heading: 0 })
      .expect(201);

    const listRes = await request(server)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${managerToken}`)
      .query({ vehicleId: vehicle.id })
      .expect(200);

    const alert = listRes.body.data.items[0];

    const { accessToken: viewerToken } = await loginAsTestUser(
      app,
      UserRole.VIEWER,
    );

    await request(server)
      .post(`/api/alerts/${alert.id}/ack`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });

  it("Alert stats endpoint returns counts", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);
    const vehicle = await createTestVehicle(app, accessToken);
    const server = app.getHttpServer();

    await request(server)
      .post(`/api/vehicles/${vehicle.id}/locations`)
      .set("x-simulator-key", simulatorKey())
      .send({ lng: 29.0, lat: 41.0, speed: 150, heading: 0 })
      .expect(201);

    const statsRes = await request(server)
      .get("/api/alerts/stats")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(statsRes.body.data.total).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.data.speedAlerts).toBeGreaterThanOrEqual(1);
  });
});
