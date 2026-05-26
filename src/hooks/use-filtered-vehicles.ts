"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store";
import type { Vehicle } from "@/types";

export function useFilteredVehicles(): Vehicle[] {
  const vehicles = useAppStore((s) => s.vehicles);
  const companyFilter = useAppStore((s) => s.companyFilter);
  const permitFilter = useAppStore((s) => s.permitFilter);
  const statusFilter = useAppStore((s) => s.statusFilter);
  const searchQuery = useAppStore((s) => s.searchQuery);

  return useMemo(() => {
    return vehicles.filter((v) => {
      if (companyFilter && v.companyId !== companyFilter) return false;
      if (permitFilter && v.permitId !== permitFilter) return false;
      if (statusFilter && v.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !v.plateNumber.toLowerCase().includes(q) &&
          !v.driverName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, companyFilter, permitFilter, statusFilter, searchQuery]);
}
