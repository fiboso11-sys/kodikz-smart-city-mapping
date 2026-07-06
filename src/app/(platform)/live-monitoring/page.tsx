"use client";

import { useMemo } from "react";
import { MapView } from "@/components/maps/MapView";
import { PageHeader } from "@/components/shared/page-header";
import { useFleetVehicles } from "@/hooks/use-vehicles";
import { useGeoUploads } from "@/hooks/use-permits";
import { useGisStore } from "@/store/gis-store";
import { liveStatusColor, liveStatusLabel } from "@/lib/vehicle-status";
import { formatSpeed, formatTime } from "@/lib/utils";
import type { VehicleWithLive } from "@/types";

export default function LiveMonitoringPage() {
  const { vehicles, isLoading } = useFleetVehicles();
  const { data: geoUploads = [] } = useGeoUploads();
  const liveFilter = useGisStore((s) => s.liveFilter);
  const setLiveFilter = useGisStore((s) => s.setLiveFilter);
  const companyFilter = useGisStore((s) => s.companyFilter);
  const setCompanyFilter = useGisStore((s) => s.setCompanyFilter);
  const permitFilter = useGisStore((s) => s.permitFilter);
  const setPermitFilter = useGisStore((s) => s.setPermitFilter);
  const searchQuery = useGisStore((s) => s.searchQuery);
  const setSearchQuery = useGisStore((s) => s.setSearchQuery);
  const setSelectedVehicleId = useGisStore((s) => s.setSelectedVehicleId);
  const setHistoryPath = useGisStore((s) => s.setHistoryPath);

  const companies = useMemo(
    () => [...new Set(vehicles.map((v) => v.companyName))].sort(),
    [vehicles]
  );
  const permits = useMemo(
    () => [...new Set(vehicles.map((v) => v.permitNumber))].sort(),
    [vehicles]
  );

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (liveFilter !== "all" && v.liveStatus !== liveFilter) return false;
      if (companyFilter && v.companyName !== companyFilter) return false;
      if (permitFilter && v.permitNumber !== permitFilter) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        v.vehicleName.toLowerCase().includes(q) ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.imei.includes(q)
      );
    });
  }, [vehicles, liveFilter, companyFilter, permitFilter, searchQuery]);

  const onRowClick = async (v: VehicleWithLive) => {
    setSelectedVehicleId(v.id);
    try {
      const res = await fetch(`/api/gps/history/${encodeURIComponent(v.imei)}?limit=50`);
      const data = (await res.json()) as { points: import("@/types").VehicleLivePosition[] };
      setHistoryPath(data.points ?? []);
    } catch {
      setHistoryPath(v.live ? [v.live] : []);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col md:h-screen">
      <PageHeader
        title="Live Monitoring"
        subtitle="Operational GIS command — vehicle tracking & path history"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1fr_420px]">
        <div className="min-h-[360px] h-full p-3">
          <MapView
            vehicles={filtered}
            geoUploadRecords={geoUploads}
            showHistoryPath
            onSelectVehicle={setSelectedVehicleId}
            className="h-full min-h-[320px]"
          />
        </div>

        <div className="flex min-h-0 flex-col border-l border-gold/10">
          <div className="space-y-2 border-b border-gold/10 p-3">
            <input
              type="search"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
            />
            <div className="flex flex-wrap gap-2">
              {(["all", "moving", "idle", "offline"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLiveFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                    liveFilter === f
                      ? "bg-gis-blue/25 text-gis-blue-light ring-1 ring-gis-blue/40"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-navy-900 px-2 py-1.5 text-xs text-white"
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={permitFilter}
                onChange={(e) => setPermitFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-navy-900 px-2 py-1.5 text-xs text-white"
              >
                <option value="">All permits</option>
                {permits.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-navy-900 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Speed</th>
                  <th className="px-3 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => void onRowClick(v)}
                      className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-white">{v.vehicleName}</p>
                        <p className="text-slate-500">{v.plateNumber}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{ color: liveStatusColor(v.liveStatus) }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: liveStatusColor(v.liveStatus) }}
                          />
                          {liveStatusLabel(v.liveStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {v.live ? formatSpeed(v.live.speed) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {v.live ? formatTime(v.live.timestamp) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
