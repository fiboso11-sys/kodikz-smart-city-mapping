import type { IGPSProvider } from "@/providers/igps-provider";
import { fetchVehicleLocationsForFleet, GpsApiError } from "@/lib/gps-api";
import { matchLocationsToFleet } from "@/lib/fleet-gps";
import type { GPSReading, Vehicle } from "@/types";

export const TELTONIKA_POLL_MS = 2000;

/**
 * Polls GET /vehicles on the VPS API (fleet mode — all IMEIs in one request).
 */
export class TeltonikaProvider implements IGPSProvider {
  readonly kind = "teltonika" as const;
  private timer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private lastError: string | null = null;
  private consecutiveFailures = 0;
  private lastSuccessAt: number | null = null;
  private getVehicles: () => Vehicle[];

  constructor(getVehicles: () => Vehicle[]) {
    this.getVehicles = getVehicles;
  }

  start(onBatch: (readings: GPSReading[]) => void, onStatus?: () => void): () => void {
    this.stop();

    const poll = async () => {
      try {
        const readings = await this.pullReadings();
        this.consecutiveFailures = 0;
        this.lastSuccessAt = Date.now();
        this.connected = readings.length > 0;
        this.lastError = readings.length
          ? null
          : "Waiting for fleet data (TCP :5000 → /vehicles)";
        if (readings.length) onBatch(readings);
      } catch (err) {
        this.consecutiveFailures += 1;
        this.connected = false;
        const msg =
          err instanceof GpsApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "GPS API unreachable";
        this.lastError =
          this.consecutiveFailures > 1
            ? `${msg} (${this.consecutiveFailures} failures — last known positions kept)`
            : msg;
        console.warn("[TeltonikaProvider]", this.lastError);
      } finally {
        onStatus?.();
      }
    };

    void poll();
    this.timer = setInterval(poll, TELTONIKA_POLL_MS);
    return () => this.stop();
  }

  private async pullReadings(): Promise<GPSReading[]> {
    const fleet = this.getVehicles();
    const locations = await fetchVehicleLocationsForFleet(fleet);
    if (locations.length === 0) return [];
    return matchLocationsToFleet(locations, fleet);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus() {
    const api = process.env.NEXT_PUBLIC_GPS_API_URL ?? "http://localhost:3000";
    return {
      connected: this.connected,
      message: this.lastError
        ? `Live GPS: ${this.lastError}`
        : `Live GPS · GET /vehicles every ${TELTONIKA_POLL_MS / 1000}s · ${api}`,
      lastSuccessAt: this.lastSuccessAt,
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}
