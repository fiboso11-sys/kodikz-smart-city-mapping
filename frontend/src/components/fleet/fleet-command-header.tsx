"use client";

import { FleetHealthPanel } from "@/components/fleet/fleet-health-panel";
import { FleetOverviewKpis } from "@/components/fleet/fleet-overview-kpis";

/** KPI + health strip above the live map. */
export function FleetCommandHeader() {
  return (
    <div className="flex shrink-0 flex-col gap-2 md:gap-3">
      <FleetOverviewKpis />
      <FleetHealthPanel />
    </div>
  );
}
