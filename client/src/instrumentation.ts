import * as Sentry from "@sentry/react";
import { env } from "./env";

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
