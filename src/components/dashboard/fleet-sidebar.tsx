"use client";

import { liveStatusColor, liveStatusLabel } from "@/lib/vehicle-status";
import { cn } from "@/lib/utils";
import type { VehicleWithLive } from "@/types";
import { Search } from "lucide-react";

interface FleetSidebarProps {
  vehicles: VehicleWithLive[];
  selectedVehicleId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function FleetSidebar({
  vehicles,
  selectedVehicleId,
  onSelect,
  searchQuery,
  onSearchChange,
}: FleetSidebarProps) {
  return (
    <div className="command-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/10 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gis-blue-light">
          Fleet Monitor
        </p>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            placeholder="IMEI, plate, company…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-navy-900 py-2 pl-8 pr-2 text-xs text-white"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {vehicles.length === 0 ? (
          <p className="p-4 text-center text-xs text-slate-500">No vehicles match</p>
        ) : (
          vehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={cn(
                "w-full border-b border-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]",
                selectedVehicleId === v.id && "bg-gis-blue/15 ring-1 ring-inset ring-gis-blue/30"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: liveStatusColor(v.liveStatus) }}
                />
                <span className="truncate text-sm font-medium text-white">{v.vehicleName}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{v.plateNumber}</p>
              <p className="truncate text-[10px] text-slate-600">{v.companyName}</p>
              <p className="mt-1 text-[10px]" style={{ color: liveStatusColor(v.liveStatus) }}>
                {liveStatusLabel(v.liveStatus)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
