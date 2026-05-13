import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGeofence1700000000005 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE "geofence_shape_enum" AS ENUM ('polygon', 'circle');
    `);

    await q.query(`
      CREATE TYPE "geofence_direction_enum" AS ENUM ('enter', 'exit', 'both');
    `);

    await q.query(`
      CREATE TYPE "geofence_applies_to_enum" AS ENUM ('all', 'specific');
    `);

    await q.query(`
      CREATE TABLE "geofence" (
        "id"              uuid                      NOT NULL DEFAULT gen_random_uuid(),
        "name"            varchar(80)               NOT NULL,
        "description"     varchar(300),
        "shape"           geofence_shape_enum       NOT NULL,
        "geometry"        geometry(Polygon, 4326),
        "circleCenter"    geometry(Point, 4326),
        "radiusMeters"    integer,
        "direction"       geofence_direction_enum   NOT NULL,
        "appliesTo"       geofence_applies_to_enum  NOT NULL,
        "vehicleIds"      uuid[]                    NOT NULL DEFAULT '{}',
        "isActive"        boolean                   NOT NULL DEFAULT true,
        "color"           varchar(9)                NOT NULL DEFAULT '#3b82f6',
        "createdById"     uuid                      NOT NULL,
        "createdAt"       timestamptz               NOT NULL DEFAULT now(),
        "updatedAt"       timestamptz               NOT NULL DEFAULT now(),

        CONSTRAINT "PK_geofence" PRIMARY KEY ("id"),
        CONSTRAINT "FK_geofence_created_by" FOREIGN KEY ("createdById")
          REFERENCES "user"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_geofence_radius" CHECK ("radiusMeters" >= 10 AND "radiusMeters" <= 100000)
      );
    `);

    await q.query(`
      CREATE INDEX "geofence_geometry_gist_idx"
        ON "geofence" USING GIST ("geometry");
    `);

    await q.query(`
      CREATE INDEX "geofence_center_gist_idx"
        ON "geofence" USING GIST ("circleCenter");
    `);

    await q.query(`
      CREATE INDEX "geofence_active_applies_idx"
        ON "geofence" ("isActive", "appliesTo");
    `);

    await q.query(`
      CREATE INDEX "geofence_created_by_idx"
        ON "geofence" ("createdById");
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "geofence";`);
    await q.query(`DROP TYPE IF EXISTS "geofence_applies_to_enum";`);
    await q.query(`DROP TYPE IF EXISTS "geofence_direction_enum";`);
    await q.query(`DROP TYPE IF EXISTS "geofence_shape_enum";`);
  }
}
