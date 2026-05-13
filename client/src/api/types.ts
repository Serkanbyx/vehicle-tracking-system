export interface Pagination<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

export type UserRole = "admin" | "manager" | "viewer";
export type VehicleType = "car" | "truck" | "van" | "motorcycle" | "bus" | "other";
export type VehicleStatus = "moving" | "idle" | "offline";
export type GeofenceShape = "polygon" | "circle";
export type GeofenceDirection = "enter" | "exit" | "both";
export type GeofenceAppliesTo = "all" | "specific";
export type AlertType = "speed" | "idle" | "geofence_enter" | "geofence_exit";
export type AlertSeverity = "info" | "warning" | "critical";
export type TripStatus = "open" | "closed";

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  fontSize?: "sm" | "md" | "lg";
  contentDensity?: "compact" | "comfortable" | "spacious";
  animations?: boolean;
  language?: string;
  notifications?: {
    email?: boolean;
    inApp?: boolean;
    severityThreshold?: "info" | "warning" | "critical";
  };
  mapDefaults?: {
    center?: [number, number];
    zoom?: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDriver {
  name?: string;
  phone?: string;
  photoUrl?: string;
  licenseNumber?: string;
}

export interface VehicleLastLocation {
  lng: number;
  lat: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: VehicleStatus;
}

export interface Vehicle {
  id: string;
  plate: string;
  vehicleType: VehicleType;
  model: string | null;
  year: number | null;
  color: string | null;
  driver: VehicleDriver;
  photoUrl: string | null;
  speedLimitKmh: number;
  isActive: boolean;
  lastLocation: VehicleLastLocation | null;
  assignedManagers: string[];
  createdById: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  timestamp: string;
  vehicleId: string;
  speed: number;
  heading: number | null;
  altitude: number | null;
  accuracy: number | null;
  source: "device" | "simulator" | "manual";
  lng?: number;
  lat?: number;
}

export interface Geofence {
  id: string;
  name: string;
  description: string | null;
  shape: GeofenceShape;
  geometry: unknown | null;
  circleCenter: unknown | null;
  radiusMeters: number | null;
  direction: GeofenceDirection;
  appliesTo: GeofenceAppliesTo;
  vehicleIds: string[];
  isActive: boolean;
  color: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  speed: number | null;
  geofenceId: string | null;
  geofence?: Geofence;
  acknowledged: boolean;
  acknowledgedById: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  startedAt: string;
  endedAt: string | null;
  distanceKm: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  speedViolations: number;
  idleEvents: number;
  geofenceEvents: number;
  pointCount: number;
  status: TripStatus;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface HeatmapPoint {
  lng: number;
  lat: number;
  intensity: number;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
  total: number;
  downsampled: boolean;
}

export interface DailySummary {
  date: string;
  totalTrips: number;
  totalDistanceKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  totalViolations: number;
}

export interface AlertStats {
  total: number;
  unacknowledged: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
}

export interface AdminStats {
  users: unknown;
  vehicles: unknown;
  alerts: unknown;
  trips: unknown;
  topViolators: unknown[];
}

export interface FleetVehicle extends Vehicle {
  recentAlertCount?: number;
}
