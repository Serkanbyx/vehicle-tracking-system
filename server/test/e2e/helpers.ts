import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { AppModule } from "../../src/app.module";
import { UserRole } from "../../src/common/enums/user-role.enum";
import { AllExceptionsFilter } from "../../src/common/filters/all-exceptions.filter";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";

let appInstance: INestApplication | null = null;
let dataSourceInstance: DataSource | null = null;

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  await app.init();

  const ds = app.get(DataSource);
  await ds.synchronize(true);

  appInstance = app;
  dataSourceInstance = ds;

  return app;
}

export function getDataSource(): DataSource {
  if (!dataSourceInstance) throw new Error("Test app not initialized");
  return dataSourceInstance;
}

export async function truncateAll(): Promise<void> {
  const ds = getDataSource();
  const entities = ds.entityMetadatas;

  for (const entity of entities) {
    const repo = ds.getRepository(entity.name);
    await repo.query(
      `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
    );
  }
}

export async function closeTestApp(): Promise<void> {
  if (appInstance) {
    await appInstance.close();
    appInstance = null;
    dataSourceInstance = null;
  }
}

/* ------------------------------------------------------------------ */
/*  Test data helpers                                                   */
/* ------------------------------------------------------------------ */

const TEST_PASSWORD = "TestPass123";
let userCounter = 0;

export interface TestUserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export async function createTestUser(
  role: UserRole = UserRole.VIEWER,
): Promise<TestUserInfo> {
  const ds = getDataSource();
  userCounter++;
  const email = `test-${role}-${userCounter}-${randomUUID().slice(0, 8)}@test.com`;
  const name = `Test ${role} ${userCounter}`;
  const hash = await bcrypt.hash(TEST_PASSWORD, 10);

  const result = await ds.query(
    `INSERT INTO "user" (name, email, password, role, "isActive")
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, name, email, role`,
    [name, email, hash, role],
  );

  return result[0];
}

export async function loginAsTestUser(
  app: INestApplication,
  role: UserRole = UserRole.VIEWER,
): Promise<{ user: TestUserInfo; accessToken: string; cookies: string[] }> {
  const user = await createTestUser(role);

  const res = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email: user.email, password: TEST_PASSWORD })
    .expect(200);

  const accessToken: string = res.body.data.accessToken;
  const cookies: string[] = res.headers["set-cookie"] ?? [];

  return { user, accessToken, cookies };
}

export async function createTestVehicle(
  app: INestApplication,
  accessToken: string,
): Promise<{ id: string; plate: string }> {
  const plate = `TEST ${randomUUID().slice(0, 6).toUpperCase()}`;

  const res = await request(app.getHttpServer())
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      plate,
      vehicleType: "car",
      driver: { name: "Test Driver" },
    })
    .expect(201);

  return { id: res.body.data.id, plate: res.body.data.plate };
}

export function simulatorKey(): string {
  return process.env.SIMULATOR_API_KEY!;
}

export { TEST_PASSWORD };
