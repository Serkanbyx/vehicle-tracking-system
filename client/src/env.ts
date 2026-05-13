const get = (k: string) => import.meta.env[k] as string | undefined;

export const env = Object.freeze({
  API_URL: get("VITE_API_URL") ?? "http://localhost:5000/api",
  WS_URL: get("VITE_WS_URL") ?? "ws://localhost:5000",
  MAP_STYLE_URL:
    get("VITE_MAP_STYLE_URL") ?? "https://tiles.openfreemap.org/styles/liberty",
  SENTRY_DSN: get("VITE_SENTRY_DSN") ?? "",
});
