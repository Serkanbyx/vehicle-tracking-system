import * as Sentry from "@sentry/react";
import { env } from "./env";
import { router } from "./router";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete (event.request.headers as Record<string, string>).Authorization;
        delete (event.request.headers as Record<string, string>).authorization;
      }
      return event;
    },
  });
}
