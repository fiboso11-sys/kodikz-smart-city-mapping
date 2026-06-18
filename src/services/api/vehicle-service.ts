import { deriveLiveStatus } from "@/lib/vehicle-status";
import { vehicleRepository } from "@/lib/repositories";
import type { VehicleLivePosition, VehicleWithLive } from "@/types";

export async function mergeLivePositions(
  liveByImei: Map<string, VehicleLivePosition>
): Promise<VehicleWithLive[]> {
  const vehicles = await vehicleRepository().findAll();
  return vehicles.map((v) => {
    const live = liveByImei.get(v.imei);
    return {
      ...v,
      live,
      liveStatus: deriveLiveStatus(live),
    };
  });
}

export function apiLocationToLive(row: {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  heading?: number;
  ignition?: boolean | null;
  receivedAt?: string;
  batteryVoltage?: number | null;
  externalPower?: boolean | null;
  gsmSignal?: number | null;
  satellites?: number | null;
}): VehicleLivePosition {
  return {
    imei: row.imei,
    latitude: row.latitude,
    longitude: row.longitude,
    speed: row.speed ?? 0,
    heading: row.heading ?? 0,
    ignition: row.ignition ?? null,
    timestamp: row.timestamp,
    receivedAt: row.receivedAt,
    batteryVoltage: row.batteryVoltage,
    externalPower: row.externalPower,
    gsmSignal: row.gsmSignal,
    satellites: row.satellites,
  };
}
