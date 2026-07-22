"use client";

import { useSgeStore } from "@/store/sge-store";
import type { RouteState } from "@/engines/sge";

const STATE_DOT: Record<RouteState, string> = {
  NOT_STARTED: "bg-gray-400",
  ON_ROUTE: "bg-green-500",
  WARNING: "bg-amber-500",
  OFF_ROUTE: "bg-red-500",
  RETURNING: "bg-blue-500",
  PAUSED: "bg-gray-400",
  COMPLETED: "bg-emerald-500",
  GPS_UNRELIABLE: "bg-orange-500",
};

export function SupervisorDashboard() {
  const byVehicle = useSgeStore((s) => s.byVehicle);
  const vehicles = Object.values(byVehicle);

  if (vehicles.length === 0) {
    return (
      <div className="rounded-lg border border-gold/10 bg-navy-900/50 p-4">
        <h3 className="text-sm font-semibold text-white">Supervisor Overview</h3>
        <p className="mt-2 text-xs text-slate-500">No active survey sessions.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/10 bg-navy-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Supervisor Overview ({vehicles.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-500">
              <th className="pb-2 pr-3">Vehicle</th>
              <th className="pb-2 pr-3">Road</th>
              <th className="pb-2 pr-3">State</th>
              <th className="pb-2 pr-3">Dev.</th>
              <th className="pb-2 pr-3">Complete</th>
              <th className="pb-2 pr-3">Remaining</th>
              <th className="pb-2 pr-3">Dir.</th>
              <th className="pb-2">GPS</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const d = v.decision;
              const gpsQ =
                !d
                  ? "—"
                  : d.gpsAccuracy <= 10
                    ? "GOOD"
                    : d.gpsAccuracy <= 25
                      ? "FAIR"
                      : d.gpsAccuracy <= 40
                        ? "POOR"
                        : "UNRELIABLE";
              return (
                <tr key={v.vehicleId} className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-medium text-white">{v.vehicleId}</td>
                  <td className="max-w-[120px] truncate py-1.5 pr-3 text-slate-400">
                    {d?.currentRoad ?? "—"}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <span className={`h-2 w-2 rounded-full ${STATE_DOT[v.routeState]}`} />
                      {v.routeState.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-slate-300">
                    {v.distanceFromRoute.toFixed(0)}m
                  </td>
                  <td className="py-1.5 pr-3 text-slate-300">
                    {v.completionPct.toFixed(0)}%
                  </td>
                  <td className="py-1.5 pr-3 text-slate-300">
                    {v.remainingMetres >= 1000
                      ? `${(v.remainingMetres / 1000).toFixed(1)}km`
                      : `${v.remainingMetres.toFixed(0)}m`}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span
                      className={
                        v.wrongDirection ? "font-medium text-red-400" : "text-emerald-400"
                      }
                    >
                      {v.wrongDirection ? "WRONG" : "OK"}
                    </span>
                  </td>
                  <td className="py-1.5 text-slate-300">{gpsQ}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
