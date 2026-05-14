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
  TEST_PASSWORD,
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

describe("RBAC E2E — Role-based access matrix", () => {
  it("Viewer cannot POST vehicles", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.VIEWER);

    await request(app.getHttpServer())
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        plate: "34 ABC 01",
        vehicleType: "car",
        driver: { name: "Driver" },
      })
      .expect(403);
  });

  it("Viewer cannot PATCH vehicles", async () => {
    const { accessToken: managerToken } = await loginAsTestUser(
      app,
      UserRole.MANAGER,
    );
    const vehicle = await createTestVehicle(app, managerToken);

    const { accessToken: viewerToken } = await loginAsTestUser(
      app,
      UserRole.VIEWER,
    );

    await request(app.getHttpServer())
      .patch(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ color: "red" })
      .expect(403);
  });

  it("Viewer cannot DELETE vehicles", async () => {
    const { accessToken: managerToken } = await loginAsTestUser(
      app,
      UserRole.MANAGER,
    );
    const vehicle = await createTestVehicle(app, managerToken);

    const { accessToken: viewerToken } = await loginAsTestUser(
      app,
      UserRole.VIEWER,
    );

    await request(app.getHttpServer())
      .delete(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });

  it("Manager can create vehicles", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.MANAGER);

    const res = await request(app.getHttpServer())
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        plate: "34 MGR 01",
        vehicleType: "truck",
        driver: { name: "Manager Driver" },
      })
      .expect(201);

    expect(res.body.data.plate).toBe("34 MGR 01");
  });

  it("Admin can create, update, and delete vehicles", async () => {
    const { accessToken } = await loginAsTestUser(app, UserRole.ADMIN);
    const server = app.getHttpServer();

    const createRes = await request(server)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        plate: "34 ADM 01",
        vehicleType: "van",
        driver: { name: "Admin Driver" },
      })
      .expect(201);

    const vehicleId = createRes.body.data.id;

    const updateRes = await request(server)
      .patch(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ color: "blue" })
      .expect(200);

    expect(updateRes.body.data.color).toBe("blue");

    await request(server)
      .delete(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });

  it("forbidNonWhitelisted rejects role in register body", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        name: "Hacker",
        email: "hacker@test.com",
        password: TEST_PASSWORD,
        role: "admin",
      })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });
});
