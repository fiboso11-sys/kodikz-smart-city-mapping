"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { AlertTriangle, Car, Radio, WifiOff } from "lucide-react";
import { FleetCommandHeader } from "@/components/fleet/fleet-command-header";
import { FleetPanel } from "@/components/fleet/fleet-panel";
import { VehicleDetailsDrawer } from "@/components/fleet/vehicle-details-drawer";
import { LiveMap } from "@/components/map/live-map";
import { MapControls } from "@/components/map/map-controls";
import { StatCard } from "@/components/layout/stat-card";
import { useAppStore } from "@/store";
import { getAnalytics } from "@/lib/violations";

export default function CommandPage() {
  const vehicles = useAppStore((s) => s.vehicles);
  const violations = useAppStore((s) => s.violations);
  const history = useAppStore((s) => s.history);
  const stats = getAnalytics(vehicles, violations, history.length);

  return (
    <div className="flex h-[100dvh] flex-col gap-3 overflow-hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-4 md:p-4">
      <header className="shrink-0 space-y-3">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
            Live Fleet Command
          </h1>
          <p className="text-xs text-slate-500 md:text-sm">Dubai Smart City · Real-time GIS</p>
        </motion.div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:pb-0">
          <div className="min-w-[8.5rem] shrink-0 md:min-w-0">
            <StatCard label="Total" value={stats.totalVehicles} icon={Car} />
          </div>
          <div className="min-w-[8.5rem] shrink-0 md:min-w-0">
            <StatCard label="Active" value={stats.activeVehicles} icon={Radio} accent="text-emerald-400" />
          </div>
          <div className="min-w-[8.5rem] shrink-0 md:min-w-0">
            <StatCard label="Offline" value={stats.offlineVehicles} icon={WifiOff} accent="text-slate-400" />
          </div>
          <div className="min-w-[8.5rem] shrink-0 md:min-w-0">
            <StatCard
              label="Violations"
              value={stats.violationsToday}
              icon={AlertTriangle}
              accent="text-red-400"
            />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-4">
        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col gap-2 md:order-2 md:gap-3">
          <FleetCommandHeader />
          <div className="glass-panel min-h-[14rem] flex-1 overflow-hidden rounded-xl p-1 md:min-h-0">
            <LiveMap />
          </div>
        </div>

        <aside className="order-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:order-1 md:w-80 md:flex-none">
          <div className="flex min-h-[12rem] max-h-[40vh] shrink-0 flex-col md:min-h-0 md:max-h-none md:flex-1">
            <FleetPanel />
          </div>

          <details className="group glass-panel mb-3 rounded-xl md:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 [&::-webkit-details-marker]:hidden">
              Filters & layers
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-white/5 px-4 pb-4">
              <MapControls embedded />
            </div>
          </details>

          <div className="hidden md:block">
            <MapControls />
          </div>
        </aside>
      </div>

      <VehicleDetailsDrawer />
    </div>
  );
}
