"use client";

import { useMemo } from "react";
import { computeFleetMetrics } from "@/lib/fleet-metrics";
import { useFilteredVehicles } from "@/hooks/use-filtered-vehicles";
import { useAppStore } from "@/store";

/** Recomputes when Zustand vehicles update (each GPS poll). */
export function useFleetMetrics() {
  const vehicles = useFilteredVehicles();
  const providerKind = useAppStore((s) => s.providerKind);

  return useMemo(
    () => computeFleetMetrics(vehicles, providerKind),
    [vehicles, providerKind]
  );
}
