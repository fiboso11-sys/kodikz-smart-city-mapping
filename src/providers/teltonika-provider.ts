import type { IGPSProvider } from "@/providers/igps-provider";
import type { GPSReading } from "@/types";

/** Placeholder — swap in when Teltonika hardware is connected. UI unchanged. */
export class TeltonikaProvider implements IGPSProvider {
  readonly kind = "teltonika" as const;

  start(_onBatch: (readings: GPSReading[]) => void): () => void {
    console.warn("[TeltonikaProvider] Not connected — enable when hardware is ready");
    return () => {};
  }

  stop(): void {}

  getStatus() {
    return { connected: false, message: "Teltonika TCP listener not configured (demo mode)" };
  }
}
