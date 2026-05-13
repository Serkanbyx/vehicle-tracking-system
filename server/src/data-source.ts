import "reflect-metadata";
import { DataSource } from "typeorm";

export const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["dist/**/*.entity.js"],
  migrations: ["dist/migrations/*.js"],
  migrationsRun: false,
  synchronize: false,
  logging:
    process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"],
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
