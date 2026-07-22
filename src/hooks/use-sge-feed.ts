/**
 * Multi-vehicle GPS → SGE bridge.
 * Feeds every active session independently.
 */

"use client";

import { useEffect, useRef } from "react";
import { useGisStore } from "@/store/gis-store";
import { useSgeStore } from "@/store/sge-store";
import { sessionManager } from "@/platform/sge";
import type { GpsPoint } from "@/engines/sge";

export function useSgeFeed(): void {
  const liveByImei = useGisStore((s) => s.liveByImei);
  const feedGps = useSgeStore((s) => s.feedGps);
  const byVehicle = useSgeStore((s) => s.byVehicle);
  const hydrated = useSgeStore((s) => s.hydrated);
  const hydrate = useSgeStore((s) => s.hydrate);
  const lastProcessedRef = useRef<Record<string, string>>({});

  // Bootstrap persistence once on mount
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    const activeIds = sessionManager.getActiveVehicleIds();
    // Also include keys from store (in case of race)
    const vehicleIds = new Set([...activeIds, ...Object.keys(byVehicle)]);

    for (const vehicleId of vehicleIds) {
      const livePos = liveByImei[vehicleId];
      if (!livePos) continue;

      const posKey = `${livePos.imei}-${livePos.timestamp}`;
      if (lastProcessedRef.current[vehicleId] === posKey) continue;
      lastProcessedRef.current[vehicleId] = posKey;

      const gps: GpsPoint = {
        latitude: livePos.latitude,
        longitude: livePos.longitude,
        accuracy:
          livePos.satellites != null
            ? Math.max(5, 50 - livePos.satellites * 3)
            : 10,
        speed: livePos.speed,
        heading: livePos.heading,
        timestamp: new Date(livePos.timestamp).getTime(),
      };

      feedGps(vehicleId, gps);
    }
  }, [liveByImei, byVehicle, feedGps, hydrated]);
}
