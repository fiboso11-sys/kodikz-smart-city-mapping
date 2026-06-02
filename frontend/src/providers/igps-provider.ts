import type { GPSReading, GPSProviderKind } from "@/types";

export interface IGPSProvider {
  readonly kind: GPSProviderKind;
  start(
    onBatch: (readings: GPSReading[]) => void,
    onStatus?: () => void
  ): () => void;
  stop(): void;
  getStatus(): { connected: boolean; message: string };
}
