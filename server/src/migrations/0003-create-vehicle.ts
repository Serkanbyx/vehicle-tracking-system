import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicle1700000000003 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE "vehicle_type_enum" AS ENUM (
        'car', 'truck', 'van', 'motorcycle', 'bus', 'other'
      );
    `);

    await q.query(`
      CREATE TABLE "vehicle" (
        "id"                uuid            NOT NULL DEFAULT gen_random_uuid(),
        "plate"             varchar(15)     NOT NULL,
        "vehicleType"       vehicle_type_enum NOT NULL,
        "model"             varchar(80),
        "year"              smallint,
        "color"             varchar(30),
        "driver"            jsonb           NOT NULL DEFAULT '{}'::jsonb,
        "photoUrl"          text,
        "speedLimitKmh"     smallint        NOT NULL DEFAULT 90,
        "isActive"          boolean         NOT NULL DEFAULT true,
        "lastLocation"      jsonb,
        "assignedManagers"  uuid[]          NOT NULL DEFAULT '{}',
        "createdById"       uuid            NOT NULL,
        "tags"              varchar(30)[]   NOT NULL DEFAULT '{}',
        "createdAt"         timestamptz     NOT NULL DEFAULT now(),
        "updatedAt"         timestamptz     NOT NULL DEFAULT now(),

        CONSTRAINT "PK_vehicle" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicle_created_by" FOREIGN KEY ("createdById")
          REFERENCES "user"("id") ON DELETE SET NULL
      );
    `);

    await q.query(`
      CREATE UNIQUE INDEX "vehicle_plate_unique_idx" ON "vehicle" ("plate");
    `);

    await q.query(`
      CREATE INDEX "vehicle_type_active_idx" ON "vehicle" ("isActive", "vehicleType");
    `);

    await q.query(`
      CREATE INDEX "vehicle_tags_idx" ON "vehicle" USING GIN ("tags");
    `);

    await q.query(`
      CREATE INDEX "vehicle_created_by_idx" ON "vehicle" ("createdById");
    `);

    await q.query(`
      CREATE INDEX "vehicle_search_idx" ON "vehicle" USING GIN (
        to_tsvector('simple',
          coalesce("plate", '') || ' ' ||
          coalesce("model", '') || ' ' ||
          coalesce("driver"->>'name', '')
        )
      );
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "vehicle";`);
    await q.query(`DROP TYPE IF EXISTS "vehicle_type_enum";`);
  }
}
