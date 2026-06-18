import { KpiCard } from "@/components/shared/page-header";
import type { DashboardKpis } from "@/types";

export function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
      <KpiCard label="Total Vehicles" value={kpis.totalVehicles} accent="gis" />
      <KpiCard label="Online" value={kpis.onlineVehicles} accent="success" />
      <KpiCard label="Moving" value={kpis.movingVehicles} accent="success" />
      <KpiCard label="Idle" value={kpis.idleVehicles} accent="gold" />
      <KpiCard label="Offline" value={kpis.offlineVehicles} accent="danger" />
      <KpiCard label="Active Permits" value={kpis.activePermits} accent="dm" />
      <KpiCard label="Routes" value={kpis.routesUploaded} accent="gis" />
      <KpiCard label="Areas" value={kpis.areasUploaded} accent="gold" />
    </div>
  );
}
