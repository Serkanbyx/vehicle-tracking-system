import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAlert1700000000006 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE "alert_type_enum" AS ENUM ('speed', 'idle', 'geofence_enter', 'geofence_exit');
    `);

    await q.query(`
      CREATE TYPE "alert_severity_enum" AS ENUM ('info', 'warning', 'critical');
    `);

    await q.query(`
      CREATE TABLE "alert" (
        "id"                uuid                NOT NULL DEFAULT gen_random_uuid(),
        "vehicleId"         uuid                NOT NULL,
        "type"              alert_type_enum     NOT NULL,
        "severity"          alert_severity_enum NOT NULL DEFAULT 'warning',
        "message"           text                NOT NULL,
        "geom"              geometry(Point, 4326) NOT NULL,
        "speed"             numeric(5,2),
        "geofenceId"        uuid,
        "acknowledged"      boolean             NOT NULL DEFAULT false,
        "acknowledgedById"  uuid,
        "acknowledgedAt"    timestamptz,
        "createdAt"         timestamptz         NOT NULL DEFAULT now(),

        CONSTRAINT "PK_alert" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alert_vehicle" FOREIGN KEY ("vehicleId")
          REFERENCES "vehicle"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_alert_geofence" FOREIGN KEY ("geofenceId")
          REFERENCES "geofence"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_alert_acknowledged_by" FOREIGN KEY ("acknowledgedById")
          REFERENCES "user"("id") ON DELETE SET NULL
      );
    `);

    await q.query(`
      CREATE INDEX "alert_vehicle_created_idx"
        ON "alert" ("vehicleId", "createdAt" DESC);
    `);

    await q.query(`
      CREATE INDEX "alert_ack_created_idx"
        ON "alert" ("acknowledged", "createdAt" DESC);
    `);

    await q.query(`
      CREATE INDEX "alert_type_idx"
        ON "alert" ("type");
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "alert";`);
    await q.query(`DROP TYPE IF EXISTS "alert_severity_enum";`);
    await q.query(`DROP TYPE IF EXISTS "alert_type_enum";`);
  }
}
