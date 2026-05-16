import "reflect-metadata";
import { join } from "node:path";
import { DataSource } from "typeorm";

const isCompiled = __filename.endsWith(".js");

export const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [isCompiled ? join(__dirname, "**/*.entity.js") : "src/**/*.entity.ts"],
  migrations: [isCompiled ? join(__dirname, "migrations/*.js") : "src/migrations/*.ts"],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"],
  ssl: process.env.DATABASE_URL?.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
