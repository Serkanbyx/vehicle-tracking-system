import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTrip1700000000007 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE "trip_status_enum" AS ENUM ('open', 'closed');
    `);

    await q.query(`
      CREATE TABLE "trip" (
        "id"               uuid                NOT NULL DEFAULT gen_random_uuid(),
        "vehicleId"        uuid                NOT NULL,
        "startedAt"        timestamptz         NOT NULL,
        "endedAt"          timestamptz,
        "startGeom"        geometry(Point, 4326) NOT NULL,
        "endGeom"          geometry(Point, 4326),
        "distanceKm"       numeric(8,2),
        "avgSpeedKmh"      numeric(5,2),
        "maxSpeedKmh"      numeric(5,2),
        "speedViolations"  integer             NOT NULL DEFAULT 0,
        "idleEvents"       integer             NOT NULL DEFAULT 0,
        "geofenceEvents"   integer             NOT NULL DEFAULT 0,
        "pointCount"       integer             NOT NULL DEFAULT 0,
        "status"           trip_status_enum    NOT NULL DEFAULT 'open',
        "createdAt"        timestamptz         NOT NULL DEFAULT now(),

        CONSTRAINT "PK_trip" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trip_vehicle" FOREIGN KEY ("vehicleId")
          REFERENCES "vehicle"("id") ON DELETE CASCADE
      );
    `);

    await q.query(`
      CREATE INDEX "trip_vehicle_started_idx"
        ON "trip" ("vehicleId", "startedAt" DESC);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "trip";`);
    await q.query(`DROP TYPE IF EXISTS "trip_status_enum";`);
  }
}
