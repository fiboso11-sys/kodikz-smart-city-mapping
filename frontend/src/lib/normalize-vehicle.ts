import { EMPTY_TELEMETRY } from "@/types/telemetry";
import type { Vehicle } from "@/types";

/** Ensure telemetry fields exist (null when absent) for seed JSON backward compatibility. */
export function normalizeVehicle(v: Vehicle): Vehicle {
  return {
    ...EMPTY_TELEMETRY,
    ...v,
    ignition: v.ignition ?? null,
    batteryVoltage: v.batteryVoltage ?? null,
    externalPower: v.externalPower ?? null,
    gsmSignal: v.gsmSignal ?? null,
    satellites: v.satellites ?? null,
  };
}
