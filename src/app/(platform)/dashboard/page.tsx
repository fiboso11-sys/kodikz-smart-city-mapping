"use client";

import { useMemo } from "react";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { FleetSidebar } from "@/components/dashboard/fleet-sidebar";
import { VehicleDetailPanel } from "@/components/dashboard/vehicle-detail-panel";
import { MapView } from "@/components/maps/MapView";
import { PageHeader } from "@/components/shared/page-header";
import { useFleetVehicles } from "@/hooks/use-vehicles";
import { usePermits, useGeoUploads } from "@/hooks/use-permits";
import { computeKpis, useGisStore } from "@/store/gis-store";

export default function DashboardPage() {
  const { vehicles, isLoading } = useFleetVehicles();
  const { data: permits = [] } = usePermits();
  const { data: geoUploads = [] } = useGeoUploads();
  const selectedVehicleId = useGisStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useGisStore((s) => s.setSelectedVehicleId);
  const searchQuery = useGisStore((s) => s.searchQuery);
  const setSearchQuery = useGisStore((s) => s.setSearchQuery);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.vehicleName.toLowerCase().includes(q) ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.imei.includes(q) ||
        v.companyName.toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  const selected = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  const kpis = computeKpis(vehicles, permits, geoUploads);

  return (
    <div className="flex h-[100dvh] flex-col md:h-screen">
      <PageHeader
        title="Executive GIS Dashboard"
        subtitle="Real-time street mapping fleet oversight — Dubai Municipality GISCD"
      />

      <div className="border-b border-gold/10 px-4 py-3">
        <KpiGrid kpis={kpis} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_1fr_300px]">
        <div className="hidden border-r border-gold/10 p-2 lg:block">
          <FleetSidebar
            vehicles={filtered}
            selectedVehicleId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="relative min-h-[360px] p-3 lg:min-h-0">
          {isLoading ? (
            <div className="command-panel flex h-full items-center justify-center text-sm text-slate-400">
              Loading fleet GIS layer…
            </div>
          ) : (
            <MapView
              vehicles={filtered}
              geoUploadRecords={geoUploads}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              className="h-full"
            />
          )}
        </div>

        <div className="hidden border-l border-gold/10 p-3 lg:block">
          <VehicleDetailPanel
            vehicle={selected}
            onClose={() => setSelectedVehicleId(null)}
          />
        </div>
      </div>
    </div>
  );
}
