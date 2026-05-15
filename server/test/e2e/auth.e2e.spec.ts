import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, TEST_PASSWORD, truncateAll } from "./helpers";

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

describe("Auth E2E — Full auth flow", () => {
  const newUser = {
    name: "Test User",
    email: "auth-flow@test.com",
    password: TEST_PASSWORD,
  };

  it("Register → Login → Me → Refresh → Reuse old refresh → Logout → Me 401", async () => {
    const server = app.getHttpServer();

    /* ── 1. Register ── */
    const registerRes = await request(server).post("/api/auth/register").send(newUser).expect(201);

    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.accessToken).toBeDefined();
    expect(registerRes.body.data.user.email).toBe(newUser.email);
    expect(registerRes.body.data.user.role).toBe("viewer");
    expect(registerRes.body.data.user).not.toHaveProperty("password");

    /* ── 2. Login ── */
    const loginRes = await request(server)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: newUser.password })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    const accessToken: string = loginRes.body.data.accessToken;
    const setCookies: string[] = loginRes.headers["set-cookie"] ?? [];
    expect(accessToken).toBeDefined();
    expect(setCookies.length).toBeGreaterThan(0);

    const refreshCookie = setCookies.find((c: string) => c.startsWith("refresh_token="));
    expect(refreshCookie).toBeDefined();

    /* ── 3. GET /me ── */
    const meRes = await request(server)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.data.user.email).toBe(newUser.email);

    /* ── 4. Refresh — rotation works ── */
    const refreshRes = await request(server)
      .post("/api/auth/refresh")
      .set("Cookie", setCookies)
      .expect(200);

    expect(refreshRes.body.data.accessToken).toBeDefined();

    const newCookies: string[] = refreshRes.headers["set-cookie"] ?? [];
    const newRefreshCookie = newCookies.find((c: string) => c.startsWith("refresh_token="));
    expect(newRefreshCookie).toBeDefined();

    /* ── 5. Reuse old refresh — session revoked ── */
    const reuseRes = await request(server)
      .post("/api/auth/refresh")
      .set("Cookie", setCookies)
      .expect(401);

    expect(reuseRes.body.success).toBeFalsy();

    /* ── 6. Logout ── */
    const freshLogin = await request(server)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: newUser.password })
      .expect(200);

    const logoutToken = freshLogin.body.data.accessToken;

    await request(server)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${logoutToken}`)
      .expect(200);

    /* ── 7. GET /me without valid token → 401 ── */
    await request(server).get("/api/auth/me").expect(401);
  });

  it("should reject registration with invalid email", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Bad", email: "not-an-email", password: TEST_PASSWORD })
      .expect(400);
  });

  it("should reject registration with short password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Short", email: "short@test.com", password: "Ab1" })
      .expect(400);
  });

  it("should reject duplicate email on registration", async () => {
    const server = app.getHttpServer();

    await request(server).post("/api/auth/register").send(newUser).expect(201);

    await request(server).post("/api/auth/register").send(newUser).expect(409);
  });

  it("should reject login with wrong password", async () => {
    const server = app.getHttpServer();

    await request(server).post("/api/auth/register").send(newUser).expect(201);

    await request(server)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: "WrongPass99" })
      .expect(401);
  });
});
