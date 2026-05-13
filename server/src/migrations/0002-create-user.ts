import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUser1700000000002 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('admin', 'manager', 'viewer');
    `);

    await q.query(`
      CREATE TABLE "user" (
        "id"                uuid            NOT NULL DEFAULT gen_random_uuid(),
        "name"              varchar(60)     NOT NULL,
        "email"             varchar(120)    NOT NULL,
        "password"          varchar(72)     NOT NULL,
        "role"              user_role_enum  NOT NULL DEFAULT 'viewer',
        "avatarUrl"         text,
        "phone"             varchar(30),
        "isActive"          boolean         NOT NULL DEFAULT true,
        "lastLoginAt"       timestamptz,
        "refreshTokenHash"  varchar(120),
        "preferences"       jsonb           NOT NULL DEFAULT '{}'::jsonb,
        "createdAt"         timestamptz     NOT NULL DEFAULT now(),
        "updatedAt"         timestamptz     NOT NULL DEFAULT now(),

        CONSTRAINT "PK_user" PRIMARY KEY ("id")
      );
    `);

    await q.query(`
      CREATE UNIQUE INDEX "IDX_user_email" ON "user" ("email");
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "user";`);
    await q.query(`DROP TYPE IF EXISTS "user_role_enum";`);
  }
}
