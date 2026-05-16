import "reflect-metadata";
import { join } from "node:path";
import { DataSource } from "typeorm";

const isCompiled = __filename.endsWith(".js");
const root = join(__dirname, "..");

export const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [join(root, isCompiled ? "dist/**/*.entity.js" : "src/**/*.entity.ts")],
  migrations: [join(root, isCompiled ? "dist/migrations/*.js" : "src/migrations/*.ts")],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"],
  ssl: process.env.DATABASE_URL?.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
