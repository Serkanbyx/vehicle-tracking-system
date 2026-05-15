import { fetcher } from "./client";
import type { Geofence, Pagination } from "./types";

export interface ListGeofencesQuery {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
  shape?: string;
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

export function listGeofences(query: ListGeofencesQuery = {}): Promise<Pagination<Geofence>> {
  return fetcher<Pagination<Geofence>>(`/geofences${toParams(query as Record<string, unknown>)}`);
}

export function getGeofence(id: string): Promise<Geofence> {
  return fetcher<Geofence>(`/geofences/${id}`);
}

export function createGeofence(dto: Partial<Geofence>): Promise<Geofence> {
  return fetcher<Geofence>("/geofences", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function updateGeofence(id: string, dto: Partial<Geofence>): Promise<Geofence> {
  return fetcher<Geofence>(`/geofences/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function removeGeofence(id: string): Promise<void> {
  return fetcher(`/geofences/${id}`, { method: "DELETE" });
}

export function testGeofence(
  id: string,
  point: { lng: number; lat: number },
): Promise<{ inside: boolean }> {
  return fetcher<{ inside: boolean }>(`/geofences/${id}/test`, {
    method: "POST",
    body: JSON.stringify(point),
  });
}
