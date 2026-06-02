import type { Vehicle, Route, Violation, ViolationType, ViolationSeverity } from "@/types";
import { distanceToRouteMeters } from "@/lib/geo";

const OVERSPEED_KMH = 80;
const NO_SIGNAL_TICKS = 20;
const IDLE_TICKS = 100;
const ROUTE_BUFFER_M = 150;

const SEVERITY: Record<ViolationType, ViolationSeverity> = {
  OUT_OF_ROUTE: "High",
  NO_SIGNAL: "Critical",
  OVERSPEED: "High",
  IDLE: "Medium",
};

let violationCounter = 0;

export function evaluateViolations(
  vehicle: Vehicle,
  route: Route | undefined,
  lastSignalTicks: number,
  recentViolations: Violation[]
): Violation[] {
  const created: Violation[] = [];
  const recentTypes = new Set(
    recentViolations
      .filter((v) => v.vehicleId === vehicle.id && Date.now() - new Date(v.createdAt).getTime() < 60000)
      .map((v) => v.type)
  );

  const add = (type: ViolationType, message: string) => {
    if (recentTypes.has(type)) return;
    created.push({
      id: `vio-${++violationCounter}-${Date.now()}`,
      vehicleId: vehicle.id,
      type,
      severity: SEVERITY[type],
      message,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      createdAt: new Date().toISOString(),
    });
  };

  if (vehicle.speed > OVERSPEED_KMH) {
    add("OVERSPEED", `Speed ${vehicle.speed.toFixed(0)} km/h exceeds ${OVERSPEED_KMH} km/h limit`);
  }

  if ((vehicle.idleTicks ?? 0) >= IDLE_TICKS && vehicle.ignition) {
    add("IDLE", "Vehicle stopped too long with ignition on");
  }

  if (lastSignalTicks >= NO_SIGNAL_TICKS) {
    add("NO_SIGNAL", "No GPS update for 60+ seconds");
  }

  if (route && distanceToRouteMeters(vehicle.longitude, vehicle.latitude, route) > ROUTE_BUFFER_M) {
    add("OUT_OF_ROUTE", "Vehicle exited approved route corridor");
  }

  return created;
}

export function getAnalytics(vehicles: Vehicle[], violations: Violation[], historyCount: number) {
  const today = new Date().toDateString();
  const violationsToday = violations.filter((v) => new Date(v.createdAt).toDateString() === today).length;
  const active = vehicles.filter((v) => v.status === "active").length;
  const offline = vehicles.filter((v) => v.status === "offline").length;
  const distanceKm = vehicles.reduce((s, v) => s + (v.speed / 3600) * 3, 0);
  const compliance = Math.max(0, Math.min(100, 100 - violationsToday * 1.5));

  return {
    totalVehicles: vehicles.length,
    activeVehicles: active,
    offlineVehicles: offline,
    violationsToday,
    distanceCoveredKm: Math.round(distanceKm * 10) / 10,
    complianceScore: Math.round(compliance * 10) / 10,
    historyPoints: historyCount,
  };
}
