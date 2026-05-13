export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string || "http://localhost:5000/api",
  wsUrl: import.meta.env.VITE_WS_URL as string || "ws://localhost:5000",
  mapStyleUrl:
    (import.meta.env.VITE_MAP_STYLE_URL as string) ||
    "https://tiles.openfreemap.org/styles/liberty",
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string || "",
} as const;
