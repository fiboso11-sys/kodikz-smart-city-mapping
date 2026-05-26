import type { IGPSProvider } from "@/providers/igps-provider";
import { SimulatorProvider } from "@/providers/simulator-provider";
import { TeltonikaProvider } from "@/providers/teltonika-provider";
import type { GPSProviderKind, Vehicle, Route } from "@/types";

export function createGPSProvider(
  kind: GPSProviderKind,
  getVehicles: () => Vehicle[],
  getRoutes: () => Route[],
  onTick: (vehicles: Vehicle[]) => Vehicle[]
): IGPSProvider {
  if (kind === "teltonika") return new TeltonikaProvider();
  return new SimulatorProvider(getVehicles, getRoutes, onTick);
}
