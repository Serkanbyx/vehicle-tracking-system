import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocation1700000000004 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "location" (
        "id"          uuid              NOT NULL DEFAULT gen_random_uuid(),
        "vehicleId"   uuid              NOT NULL,
        "geom"        geometry(Point, 4326) NOT NULL,
        "speed"       numeric(5,2)      NOT NULL,
        "heading"     smallint,
        "altitude"    numeric(7,2),
        "accuracy"    numeric(6,2),
        "source"      varchar(16)       NOT NULL DEFAULT 'device',
        "timestamp"   timestamptz       NOT NULL DEFAULT now(),

        CONSTRAINT "PK_location" PRIMARY KEY ("id", "timestamp"),

        CONSTRAINT "FK_location_vehicle" FOREIGN KEY ("vehicleId")
          REFERENCES "vehicle"("id") ON DELETE CASCADE,

        CONSTRAINT "CHK_location_speed" CHECK ("speed" >= 0 AND "speed" <= 400),
        CONSTRAINT "CHK_location_heading" CHECK ("heading" >= 0 AND "heading" <= 359),
        CONSTRAINT "CHK_location_source" CHECK ("source" IN ('device', 'simulator', 'manual'))
      );
    `);

    await q.query(`
      CREATE INDEX "location_vehicle_time_idx"
        ON "location" ("vehicleId", "timestamp" DESC);
    `);

    await q.query(`
      CREATE INDEX "location_geom_gist_idx"
        ON "location" USING GIST ("geom");
    `);

    await q.query(`
      CREATE INDEX "location_timestamp_idx"
        ON "location" ("timestamp" DESC);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "location";`);
  }
}
