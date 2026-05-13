import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number.parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  simulatorApiKey: process.env.SIMULATOR_API_KEY,
  speedLimitKmh: Number.parseInt(process.env.SPEED_LIMIT_KMH || "90", 10),
  idleThresholdMin: Number.parseInt(
    process.env.IDLE_THRESHOLD_MIN || "10",
    10,
  ),
  tripEndMin: Number.parseInt(process.env.TRIP_END_MIN || "5", 10),
  sentryDsn: process.env.SENTRY_DSN,
  logLevel: process.env.LOG_LEVEL || "info",
}));
