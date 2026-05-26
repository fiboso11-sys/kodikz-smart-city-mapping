"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Car, Radio, WifiOff } from "lucide-react";
import { LiveMap } from "@/components/map/live-map";
import { MapControls } from "@/components/map/map-controls";
import { StatCard } from "@/components/layout/stat-card";
import { useAppStore } from "@/store";
import { getAnalytics } from "@/lib/violations";
import { formatSpeed, formatTime } from "@/lib/utils";

export default function CommandPage() {
  const vehicles = useAppStore((s) => s.vehicles);
  const violations = useAppStore((s) => s.violations);
  const history = useAppStore((s) => s.history);
  const selectedId = useAppStore((s) => s.selectedVehicleId);
  const selected = vehicles.find((v) => v.id === selectedId);
  const getCompany = useAppStore((s) => s.getCompany);
  const stats = getAnalytics(vehicles, violations, history.length);

  return (
    <div className="flex h-screen flex-col p-4">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Live Fleet Command</h1>
          <p className="text-sm text-slate-500">Dubai Smart City · Real-time GIS Monitoring</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={stats.totalVehicles} icon={Car} />
          <StatCard label="Active" value={stats.activeVehicles} icon={Radio} accent="text-emerald-400" />
          <StatCard label="Offline" value={stats.offlineVehicles} icon={WifiOff} accent="text-slate-400" />
          <StatCard label="Violations" value={stats.violationsToday} icon={AlertTriangle} accent="text-red-400" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
          <MapControls />
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-4 text-sm"
            >
              <h3 className="text-lg font-semibold text-blue-400">{selected.plateNumber}</h3>
              <dl className="mt-3 space-y-2 text-slate-400">
                <div className="flex justify-between gap-4">
                  <dt>Driver</dt>
                  <dd className="text-white">{selected.driverName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Company</dt>
                  <dd className="text-right text-white">{getCompany(selected.companyId)?.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Speed</dt>
                  <dd className="text-white">{formatSpeed(selected.speed)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Updated</dt>
                  <dd className="text-white">{formatTime(selected.lastUpdate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Ignition</dt>
                  <dd className={selected.ignition ? "text-emerald-400" : "text-slate-500"}>
                    {selected.ignition ? "ON" : "OFF"}
                  </dd>
                </div>
              </dl>
            </motion.div>
          )}
        </div>
        <div className="glass-panel min-h-0 flex-1 rounded-xl p-1">
          <LiveMap />
        </div>
      </div>
    </div>
  );
}
