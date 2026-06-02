"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { VehicleStatusBadge } from "@/components/fleet/vehicle-status-badge";
import { useFilteredVehicles } from "@/hooks/use-filtered-vehicles";
import { effectiveFleetStatus, isReportingWithin } from "@/lib/fleet-metrics";
import { formatIgnition, ignitionClass } from "@/lib/telemetry";
import { formatSpeed } from "@/lib/utils";
import { useAppStore } from "@/store";
import type { VehicleStatus } from "@/types";

export function FleetPanel() {
  const vehicles = useFilteredVehicles();
  const selectedId = useAppStore((s) => s.selectedVehicleId);
  const setSelectedVehicle = useAppStore((s) => s.setSelectedVehicle);
  const providerKind = useAppStore((s) => s.providerKind);
  const getCompany = useAppStore((s) => s.getCompany);

  const registry = useAppStore((s) => s.vehicles);
  const liveImeis = useMemo(() => {
    if (providerKind !== "teltonika") return null;
    return new Set(
      registry.filter((v) => v.imei && isReportingWithin(v.lastUpdate)).map((v) => v.imei!)
    );
  }, [registry, providerKind]);

  const sorted = useMemo(
    () => [...vehicles].sort((a, b) => a.plateNumber.localeCompare(b.plateNumber)),
    [vehicles]
  );

  const liveCount = sorted.filter((v) => v.imei && liveImeis?.has(v.imei)).length;

  return (
    <div className="glass-panel flex min-h-0 flex-col rounded-xl">
      <div className="border-b border-white/5 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fleet
        </h2>
        <p className="mt-0.5 text-sm text-white">
          {sorted.length} vehicles
          {providerKind === "teltonika" && (
            <span className="text-slate-500"> · {liveCount} live GPS</span>
          )}
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {sorted.map((v) => {
          const live =
            providerKind === "simulator" ||
            Boolean(v.imei && liveImeis?.has(v.imei)) ||
            isReportingWithin(v.lastUpdate);
          const status: VehicleStatus =
            providerKind === "teltonika"
              ? effectiveFleetStatus(v, providerKind)
              : v.status;
          const selected = v.id === selectedId;
          const company = getCompany(v.companyId);

          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setSelectedVehicle(v.id)}
                className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? "bg-cyan-500/10 ring-1 ring-cyan-500/40"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{v.plateNumber}</p>
                    <p className="truncate text-xs text-slate-500">
                      {company?.name ?? v.driverName}
                    </p>
                  </div>
                  <VehicleStatusBadge status={status} live={live} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>{formatSpeed(v.speed)}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    {v.ignition != null && (
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wide ${ignitionClass(v.ignition)}`}
                        title={`Ignition ${formatIgnition(v.ignition)}`}
                      >
                        {formatIgnition(v.ignition)}
                      </span>
                    )}
                    {v.imei && (
                      <span className="font-mono text-[10px] text-slate-600">
                        …{v.imei.slice(-6)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {sorted.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 text-center text-sm text-slate-500"
        >
          No vehicles match filters
        </motion.p>
      )}
    </div>
  );
}
