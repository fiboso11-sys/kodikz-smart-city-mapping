import { MOVING_SPEED_KMH, OFFLINE_THRESHOLD_MS } from "@/lib/config";
import type { VehicleLivePosition, VehicleLiveStatus } from "@/types";

export function deriveLiveStatus(live?: VehicleLivePosition | null): VehicleLiveStatus {
  if (!live?.timestamp) return "offline";
  const age = Date.now() - new Date(live.timestamp).getTime();
  if (age > OFFLINE_THRESHOLD_MS) return "offline";
  if ((live.speed ?? 0) > MOVING_SPEED_KMH) return "moving";
  return "idle";
}

export function isOnline(liveStatus: VehicleLiveStatus): boolean {
  return liveStatus === "moving" || liveStatus === "idle";
}

export function liveStatusColor(status: VehicleLiveStatus): string {
  switch (status) {
    case "moving":
      return "#22c55e";
    case "idle":
      return "#eab308";
    case "offline":
      return "#94a3b8";
  }
}

export function liveStatusLabel(status: VehicleLiveStatus): string {
  switch (status) {
    case "moving":
      return "Moving";
    case "idle":
      return "Idle";
    case "offline":
      return "Offline";
  }
}
