"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store";
import type { Route } from "@/types";

/** Only routes tied to current fleet — avoids hundreds of overlapping lines. */
export function useVisibleRoutes(): Route[] {
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const companyFilter = useAppStore((s) => s.companyFilter);
  const layers = useAppStore((s) => s.layers);

  const replayMode = useAppStore((s) => s.replayMode);
  const replayVehicleId = useAppStore((s) => s.replayVehicleId);

  return useMemo(() => {
    if (replayMode && replayVehicleId) {
      const v = vehicles.find((x) => x.id === replayVehicleId);
      const route = v?.assignedRouteId
        ? routes.find((r) => r.id === v.assignedRouteId)
        : undefined;
      return route ? [{ ...route, color: "#64748b" }] : [];
    }
    if (!layers.routes) return [];
    const vehicleIds = new Set(vehicles.map((v) => v.id));
    return routes
      .filter((r) => {
        if (!r.vehicleId || !vehicleIds.has(r.vehicleId)) return false;
        if (companyFilter && r.companyId !== companyFilter) return false;
        return r.geometry.coordinates.length >= 2;
      })
      .map((r) => ({ ...r, color: "#2563eb" }));
  }, [routes, vehicles, companyFilter, layers.routes, replayMode, replayVehicleId]);
}
