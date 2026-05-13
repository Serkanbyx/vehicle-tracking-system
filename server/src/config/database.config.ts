import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

export const databaseModule = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    type: "postgres" as const,
    url: cfg.get<string>("DATABASE_URL"),
    autoLoadEntities: true,
    migrationsRun: false,
    synchronize: false,
    migrations: ["dist/migrations/*.js"],
    logging:
      cfg.get<string>("NODE_ENV") !== "production"
        ? (["error", "warn"] as const)
        : (["error"] as const),
    ssl:
      cfg.get<string>("NODE_ENV") === "production"
        ? { rejectUnauthorized: false }
        : false,
  }),
});
