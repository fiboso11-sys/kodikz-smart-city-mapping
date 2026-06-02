import type { ApiVehicleLocation } from "@/lib/gps-api";
import type { GPSReading, Vehicle } from "@/types";

/** Stable IMEI → vehicleId when registry has no IMEI (demo / simulation). */
const imeiBindings = new Map<string, string>();

const DEFAULT_DEMO_IMEIS = [
  "352093089674033",
  "352093089674034",
  "352093089674035",
  "352093089674036",
  "352093089674037",
];

/** Assign demo IMEIs to first N fleet rows for live GPS mode. */
export function withFleetImeis(vehicles: Vehicle[], enabled: boolean): Vehicle[] {
  if (!enabled) return vehicles;
  return vehicles.map((v, index) => {
    if (v.imei) return v;
    const imei = DEFAULT_DEMO_IMEIS[index];
    return imei ? { ...v, imei } : v;
  });
}

/**
 * Map API locations (by IMEI) onto fleet registry vehicles.
 */
export function matchLocationsToFleet(
  locations: ApiVehicleLocation[],
  fleet: Vehicle[]
): GPSReading[] {
  const readings: GPSReading[] = [];
  const byImei = new Map(
    fleet.filter((v): v is Vehicle & { imei: string } => Boolean(v.imei)).map((v) => [v.imei, v])
  );

  for (const loc of locations) {
    let vehicle: Vehicle | undefined = byImei.get(loc.imei);
    if (!vehicle) {
      const boundId = imeiBindings.get(loc.imei);
      if (boundId) vehicle = fleet.find((v) => v.id === boundId);
    }
    if (!vehicle) {
      const boundIds = new Set(imeiBindings.values());
      const unbound = fleet
        .filter((v) => !v.imei && !boundIds.has(v.id))
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      if (unbound) {
        vehicle = unbound;
        imeiBindings.set(loc.imei, vehicle.id);
      }
    }

    const defaultVehicleId = process.env.NEXT_PUBLIC_GPS_VEHICLE_ID?.trim();
    if (!vehicle && defaultVehicleId) {
      vehicle = fleet.find((v) => v.id === defaultVehicleId);
    }
    if (!vehicle && fleet.length === 1) {
      vehicle = fleet[0];
    }
    if (!vehicle) continue;

    readings.push({
      vehicleId: vehicle.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed: loc.speed,
      heading: loc.heading ?? vehicle.heading,
      ignition: loc.ignition ?? (loc.speed > 2 ? true : null),
      batteryVoltage: loc.batteryVoltage ?? null,
      externalPower: loc.externalPower ?? null,
      gsmSignal: loc.gsmSignal ?? null,
      satellites: loc.satellites ?? null,
      timestamp: loc.timestamp,
    });
  }

  return readings;
}
