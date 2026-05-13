import { fetcher } from "./client";
import type { HeatmapResponse, Pagination, Vehicle } from "./types";

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

export interface ListVehiclesQuery {
  page?: number;
  limit?: number;
  q?: string;
  vehicleType?: string;
  isActive?: boolean;
  sort?: string;
  order?: "ASC" | "DESC";
}

export function listVehicles(query: ListVehiclesQuery = {}): Promise<Pagination<Vehicle>> {
  return fetcher<Pagination<Vehicle>>(`/vehicles${toParams(query as Record<string, unknown>)}`);
}

export function getVehicle(id: string): Promise<Vehicle> {
  return fetcher<Vehicle>(`/vehicles/${id}`);
}

export function createVehicle(dto: Partial<Vehicle>): Promise<Vehicle> {
  return fetcher<Vehicle>("/vehicles", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function updateVehicle(id: string, dto: Partial<Vehicle>): Promise<Vehicle> {
  return fetcher<Vehicle>(`/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function removeVehicle(id: string): Promise<void> {
  return fetcher(`/vehicles/${id}`, { method: "DELETE" });
}

export function getNearby(lng: number, lat: number, radiusKm?: number): Promise<Vehicle[]> {
  const params = toParams({ lng, lat, radiusKm });
  return fetcher<Vehicle[]>(`/vehicles/nearby${params}`);
}

export function bulkActivate(ids: string[], isActive: boolean): Promise<void> {
  return fetcher("/vehicles/bulk-activate", {
    method: "PATCH",
    body: JSON.stringify({ ids, isActive }),
  });
}

export function getVehicleStats(id: string): Promise<unknown> {
  return fetcher(`/vehicles/${id}/stats`);
}

export interface ExportRouteQuery {
  from: string;
  to: string;
  format: "csv" | "geojson";
}

export async function exportRoute(id: string, query: ExportRouteQuery): Promise<Blob> {
  const params = toParams(query as Record<string, unknown>);
  const url = `/vehicles/${id}/export${params}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export function getHeatmap(id: string, query: { from: string; to: string }): Promise<HeatmapResponse> {
  const params = toParams(query as Record<string, unknown>);
  return fetcher<HeatmapResponse>(`/vehicles/${id}/heatmap${params}`);
}
