"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { deriveLiveStatus } from "@/lib/vehicle-status";
import { useGisStore } from "@/store/gis-store";
import type { VehicleMaster, VehicleWithLive } from "@/types";

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      if (!res.ok) throw new Error("Failed to load vehicles");
      const data = await res.json();
      return data.vehicles as VehicleMaster[];
    },
  });
}

export function useVehiclesLive() {
  return useQuery({
    queryKey: ["vehicles-live"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles/live");
      if (!res.ok) throw new Error("Failed to load live vehicles");
      const data = await res.json();
      return data.vehicles as VehicleWithLive[];
    },
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
    staleTime: 3000,
  });
}

/** Merges Socket.IO / poll updates from Zustand with REST fleet snapshot. */
export function useFleetVehicles() {
  const query = useVehiclesLive();
  const liveByImei = useGisStore((s) => s.liveByImei);

  const vehicles = useMemo(() => {
    if (!query.data) return [];
    return query.data.map((v) => {
      const live = liveByImei[v.imei] ?? v.live;
      return { ...v, live, liveStatus: deriveLiveStatus(live) };
    });
  }, [query.data, liveByImei]);

  return { ...query, vehicles };
}
