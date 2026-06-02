import type { IGPSProvider } from "@/providers/igps-provider";
import type { GPSReading, Vehicle, Route } from "@/types";
import { tickVehicle } from "@/lib/geo";

const INTERVAL_MS = 3000;

export class SimulatorProvider implements IGPSProvider {
  readonly kind = "simulator" as const;
  private timer: ReturnType<typeof setInterval> | null = null;
  private getVehicles: () => Vehicle[];
  private getRoutes: () => Route[];
  private onTick: (vehicles: Vehicle[]) => Vehicle[];

  constructor(
    getVehicles: () => Vehicle[],
    getRoutes: () => Route[],
    onTick: (vehicles: Vehicle[]) => Vehicle[]
  ) {
    this.getVehicles = getVehicles;
    this.getRoutes = getRoutes;
    this.onTick = onTick;
  }

  start(onBatch: (readings: GPSReading[]) => void, onStatus?: () => void): () => void {
    this.stop();
    this.timer = setInterval(() => {
      const routes = this.getRoutes();
      const routeMap = new Map(routes.map((r) => [r.id, r]));
      const updated = this.getVehicles().map((v) =>
        tickVehicle(v, v.assignedRouteId ? routeMap.get(v.assignedRouteId) : undefined)
      );
      this.onTick(updated);
      onBatch(
        updated.map((v) => ({
          vehicleId: v.id,
          latitude: v.latitude,
          longitude: v.longitude,
          speed: v.speed,
          heading: v.heading,
          ignition: v.ignition,
          timestamp: v.lastUpdate,
        }))
      );
      onStatus?.();
    }, INTERVAL_MS);
    onStatus?.();
    return () => this.stop();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus() {
    return { connected: this.timer !== null, message: "Simulation engine active — 3s tick" };
  }
}
