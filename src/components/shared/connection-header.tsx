"use client";

import { useGisStore } from "@/store/gis-store";
import type { GpsConnectionStatus } from "@/services/gps-service";
import { DUBAI_TIME_LABEL, formatDubaiTime } from "@/lib/time";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<GpsConnectionStatus, string> = {
  CONNECTED: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  DISCONNECTED: "text-dm-red-light border-dm-red/30 bg-dm-red/10",
  RECONNECTING: "text-gold border-gold/30 bg-gold/10",
};

export function ConnectionHeader() {
  const connectionStatus = useGisStore((s) => s.connectionStatus);
  const socketLive = useGisStore((s) => s.socketLive);
  const lastGpsUpdateAt = useGisStore((s) => s.lastGpsUpdateAt);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
          STATUS_STYLES[connectionStatus]
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            connectionStatus === "CONNECTED"
              ? "animate-pulse bg-emerald-400"
              : connectionStatus === "RECONNECTING"
                ? "animate-pulse bg-gold"
                : "bg-dm-red"
          )}
        />
        GPS {connectionStatus}
      </div>
      {socketLive && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
          LIVE
        </div>
      )}
      {lastGpsUpdateAt ? (
        <span className="hidden text-[10px] text-slate-500 lg:inline">
          Updated {formatDubaiTime(lastGpsUpdateAt)} {DUBAI_TIME_LABEL}
        </span>
      ) : (
        <span className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-600 lg:inline">
          {DUBAI_TIME_LABEL}
        </span>
      )}
    </div>
  );
}

export function GpsWarningBanner() {
  const connectionStatus = useGisStore((s) => s.connectionStatus);
  const gpsError = useGisStore((s) => s.gpsError);

  if (connectionStatus === "CONNECTED" && !gpsError?.includes("No live")) return null;

  const message =
    connectionStatus === "DISCONNECTED"
      ? gpsError ?? "GPS backend unavailable — showing master data only"
      : gpsError ?? "Reconnecting to GPS backend…";

  return (
    <div
      className={cn(
        "border-b px-4 py-2 text-center text-xs",
        connectionStatus === "DISCONNECTED"
          ? "border-dm-red/30 bg-dm-red/10 text-dm-red-light"
          : "border-gold/30 bg-gold/10 text-gold"
      )}
    >
      {message}
    </div>
  );
}
