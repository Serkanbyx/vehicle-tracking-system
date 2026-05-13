import { fetcher } from "./client";
import type { Alert, AlertStats, Pagination } from "./types";

export interface ListAlertsQuery {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  acknowledged?: boolean;
  vehicleId?: string;
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

export function listAlerts(query: ListAlertsQuery = {}): Promise<Pagination<Alert>> {
  return fetcher<Pagination<Alert>>(`/alerts${toParams(query as Record<string, unknown>)}`);
}

export function acknowledgeAlert(id: string): Promise<Alert> {
  return fetcher<Alert>(`/alerts/${id}/acknowledge`, { method: "PATCH" });
}

export function acknowledgeMany(ids: string[]): Promise<{ affected: number }> {
  return fetcher<{ affected: number }>("/alerts/acknowledge", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export function removeAlert(id: string): Promise<void> {
  return fetcher(`/alerts/${id}`, { method: "DELETE" });
}

export function getAlertStats(): Promise<AlertStats> {
  return fetcher<AlertStats>("/alerts/stats");
}
