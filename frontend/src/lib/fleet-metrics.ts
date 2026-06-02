import type { GPSProviderKind, Vehicle, VehicleStatus } from "@/types";

export const REPORTING_THRESHOLD_MS = 15_000;

export function isReportingWithin(lastUpdate: string, nowMs: number = Date.now()): boolean {
  return nowMs - new Date(lastUpdate).getTime() < REPORTING_THRESHOLD_MS;
}

export function effectiveFleetStatus(
  vehicle: Vehicle,
  providerKind: GPSProviderKind,
  nowMs: number = Date.now()
): VehicleStatus {
  const reporting = isReportingWithin(vehicle.lastUpdate, nowMs);
  if (providerKind === "teltonika" && !reporting && vehicle.status !== "violation") {
    return "offline";
  }
  return vehicle.status;
}

export interface FleetMetrics {
  total: number;
  active: number;
  idle: number;
  offline: number;
  reporting: number;
}

export function computeFleetMetrics(
  vehicles: Vehicle[],
  providerKind: GPSProviderKind,
  nowMs: number = Date.now()
): FleetMetrics {
  let active = 0;
  let idle = 0;
  let offline = 0;
  let reporting = 0;

  for (const v of vehicles) {
    if (isReportingWithin(v.lastUpdate, nowMs)) reporting += 1;

    const status = effectiveFleetStatus(v, providerKind, nowMs);
    if (status === "active" || status === "violation") active += 1;
    else if (status === "idle") idle += 1;
    else if (status === "offline") offline += 1;
  }

  return {
    total: vehicles.length,
    active,
    idle,
    offline,
    reporting,
  };
}
