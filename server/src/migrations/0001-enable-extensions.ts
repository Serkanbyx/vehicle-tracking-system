import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableExtensions1700000000001 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP EXTENSION IF EXISTS pgcrypto;`);
    await q.query(`DROP EXTENSION IF EXISTS postgis;`);
  }
}
