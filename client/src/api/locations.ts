import { fetcher } from "./client";
import type { Location } from "./types";

export interface HistoryQuery {
  vehicleId: string;
  from: string;
  to: string;
  limit?: number;
}

export function getHistory(query: HistoryQuery): Promise<Location[]> {
  const { vehicleId, ...rest } = query;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return fetcher<Location[]>(`/vehicles/${vehicleId}/locations${qs ? `?${qs}` : ""}`);
}

export function getLatest(vehicleId: string): Promise<Location> {
  return fetcher<Location>(`/vehicles/${vehicleId}/locations/latest`);
}
