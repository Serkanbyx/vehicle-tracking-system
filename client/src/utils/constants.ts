import type { AlertSeverity, AlertType, UserRole, VehicleStatus } from "@/api/types";

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  moving: "Moving",
  idle: "Idle",
  offline: "Offline",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  speed: "Speed",
  idle: "Idle",
  geofence_enter: "Geofence Enter",
  geofence_exit: "Geofence Exit",
};
