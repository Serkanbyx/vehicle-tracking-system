import { fetcher } from "./client";
import type { DailySummary, Pagination, Trip } from "./types";

export interface ListTripsQuery {
  page?: number;
  limit?: number;
  vehicleId?: string;
  status?: string;
  from?: string;
  to?: string;
}

function toParams(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export function listTrips(query: ListTripsQuery = {}): Promise<Pagination<Trip>> {
  return fetcher<Pagination<Trip>>(`/trips${toParams(query as Record<string, unknown>)}`);
}

export function getTrip(id: string): Promise<Trip> {
  return fetcher<Trip>(`/trips/${id}`);
}

export function getDailySummary(query: {
  vehicleId?: string;
  from: string;
  to: string;
}): Promise<DailySummary[]> {
  return fetcher<DailySummary[]>(
    `/trips/daily-summary${toParams(query as Record<string, unknown>)}`,
  );
}

export async function exportTripsCsv(query: {
  vehicleId?: string;
  from: string;
  to: string;
}): Promise<Blob> {
  const params = toParams(query as Record<string, unknown>);
  const res = await fetch(`/trips/export${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}
