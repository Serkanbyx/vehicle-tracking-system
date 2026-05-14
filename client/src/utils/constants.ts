import type { VehicleStatus, UserRole, AlertSeverity, AlertType } from "@/api/types";

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  moving: "Hareket",
  idle: "Boşta",
  offline: "Çevrimdışı",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Bilgi",
  warning: "Uyarı",
  critical: "Kritik",
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  speed: "Hız",
  idle: "Rölanti",
  geofence_enter: "Bölge Giriş",
  geofence_exit: "Bölge Çıkış",
};
