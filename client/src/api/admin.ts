import { fetcher } from "./client";
import type { AdminStats, FleetVehicle, Pagination, User, UserRole } from "./types";

export interface ListAdminUsersQuery {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  isActive?: boolean;
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

export function getAdminStats(): Promise<AdminStats> {
  return fetcher<AdminStats>("/admin/stats");
}

export function listAdminUsers(query: ListAdminUsersQuery = {}): Promise<Pagination<User>> {
  return fetcher<Pagination<User>>(`/admin/users${toParams(query as Record<string, unknown>)}`);
}

export function getAdminUser(id: string): Promise<User> {
  return fetcher<User>(`/admin/users/${id}`);
}

export function setUserRole(id: string, role: UserRole): Promise<User> {
  return fetcher<User>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function setUserActive(id: string, isActive: boolean): Promise<User> {
  return fetcher<User>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function removeUser(id: string): Promise<void> {
  return fetcher(`/admin/users/${id}`, { method: "DELETE" });
}

export function getAdminFleet(): Promise<FleetVehicle[]> {
  return fetcher<FleetVehicle[]>("/admin/fleet");
}
