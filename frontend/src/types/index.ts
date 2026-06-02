import type { VehicleTelemetry } from "@/types/telemetry";

export type { VehicleTelemetry } from "@/types/telemetry";

export type VehicleType = "SUV" | "Pickup" | "Van" | "Truck" | "Municipality Vehicle";
export type VehicleStatus = "active" | "idle" | "offline" | "violation";
export type ViolationType = "OUT_OF_ROUTE" | "NO_SIGNAL" | "OVERSPEED" | "IDLE";
export type ViolationSeverity = "Low" | "Medium" | "High" | "Critical";

export interface Company {
  id: string;
  name: string;
  tradeLicense: string;
  contactEmail: string;
  status: string;
}

export interface Permit {
  id: string;
  code: string;
  companyId: string;
  validFrom: string;
  validTo: string;
  status: string;
}

export interface Route {
  id: string;
  name: string;
  companyId: string | null;
  permitId: string | null;
  vehicleId: string | null;
  color: string;
  geometry: GeoJSON.LineString;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  companyId: string;
  vehicleType: VehicleType;
  driverName: string;
  permitId: string | null;
  assignedRouteId: string | null;
  status: VehicleStatus;
  imei: string | null;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  /** null when device has not reported ignition IO */
  ignition: boolean | null;
  batteryVoltage: number | null;
  externalPower: boolean | null;
  gsmSignal: number | null;
  satellites: number | null;
  lastUpdate: string;
  routeProgress: number;
  waypointIndex: number;
  targetLat: number;
  targetLng: number;
  idleTicks?: number;
}

export interface Violation {
  id: string;
  vehicleId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  message: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface GpsHistoryPoint {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition: boolean;
  timestamp: string;
}

export interface GPSReading {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition: boolean | null;
  batteryVoltage?: number | null;
  externalPower?: boolean | null;
  gsmSignal?: number | null;
  satellites?: number | null;
  timestamp: string;
}

export type ApiVehicleTelemetry = VehicleTelemetry;

export interface MapLayers {
  vehicles: boolean;
  routes: boolean;
  violations: boolean;
  heatmap: boolean;
}

export type GPSProviderKind = "simulator" | "teltonika";
