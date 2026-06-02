"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { VehicleStatusBadge } from "@/components/fleet/vehicle-status-badge";
import { effectiveFleetStatus, isReportingWithin } from "@/lib/fleet-metrics";
import {
  formatExternalPower,
  formatGsmSignal,
  formatIgnition,
  formatSatellites,
  formatVoltage,
  ignitionClass,
} from "@/lib/telemetry";
import { formatSpeed, formatTime } from "@/lib/utils";
import { useAppStore } from "@/store";
import type { GPSProviderKind } from "@/types";

function gpsAgeSeconds(lastUpdate: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(lastUpdate).getTime()) / 1000));
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-right text-sm text-white ${valueClassName ?? ""}`}>{value}</dd>
    </div>
  );
}

export function VehicleDetailsDrawer() {
  const selectedId = useAppStore((s) => s.selectedVehicleId);
  const setSelectedVehicle = useAppStore((s) => s.setSelectedVehicle);
  const vehicle = useAppStore((s) =>
    selectedId ? s.vehicles.find((v) => v.id === selectedId) : undefined
  );
  const providerKind = useAppStore((s) => s.providerKind);
  const getCompany = useAppStore((s) => s.getCompany);
  const [now, setNow] = useState(() => Date.now());

  const open = Boolean(vehicle);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVehicle(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setSelectedVehicle]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setSelectedVehicle(null);

  const live = vehicle
    ? providerKind === "simulator" || isReportingWithin(vehicle.lastUpdate, now)
    : false;
  const status = vehicle
    ? effectiveFleetStatus(vehicle, providerKind as GPSProviderKind, now)
    : "offline";
  const company = vehicle ? getCompany(vehicle.companyId) : undefined;

  return (
    <AnimatePresence>
      {open && vehicle && (
        <>
          <motion.button
            type="button"
            aria-label="Close vehicle details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px] md:bg-black/40"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-details-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="glass-panel fixed inset-y-0 right-0 z-[72] flex w-full max-w-[min(100vw,24rem)] flex-col border-l border-white/10 shadow-2xl md:max-w-md"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vehicle details
                </p>
                <h2
                  id="vehicle-details-title"
                  className="mt-1 truncate text-lg font-semibold text-blue-400"
                >
                  {vehicle.plateNumber}
                </h2>
                <p className="truncate text-sm text-slate-400">
                  {vehicle.vehicleType}
                  {company ? ` · ${company.name}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex shrink-0 items-center justify-between px-4 py-3">
              <VehicleStatusBadge status={status} live={live && providerKind === "teltonika"} />
              <span className="font-mono text-xs text-slate-500">{vehicle.driverName}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <dl className="text-sm">
                <DetailRow label="Vehicle name" value={vehicle.plateNumber} />
                <DetailRow
                  label="IMEI"
                  value={vehicle.imei ?? "—"}
                  valueClassName={vehicle.imei ? "font-mono text-xs" : "text-slate-500"}
                />
                <DetailRow
                  label="Status"
                  value={status.charAt(0).toUpperCase() + status.slice(1)}
                />
                <DetailRow label="Speed" value={formatSpeed(vehicle.speed)} />
                <DetailRow label="Heading" value={`${Math.round(vehicle.heading)}°`} />
                <DetailRow
                  label="Latitude"
                  value={vehicle.latitude.toFixed(6)}
                  valueClassName="font-mono text-xs"
                />
                <DetailRow
                  label="Longitude"
                  value={vehicle.longitude.toFixed(6)}
                  valueClassName="font-mono text-xs"
                />
                <DetailRow label="Last update" value={formatTime(vehicle.lastUpdate)} />
                <DetailRow
                  label="GPS age"
                  value={`${gpsAgeSeconds(vehicle.lastUpdate, now)} s`}
                  valueClassName={
                    gpsAgeSeconds(vehicle.lastUpdate, now) > 30
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                />
                <DetailRow
                  label="Ignition"
                  value={formatIgnition(vehicle.ignition)}
                  valueClassName={ignitionClass(vehicle.ignition)}
                />
                <DetailRow
                  label="Battery voltage"
                  value={formatVoltage(vehicle.batteryVoltage)}
                  valueClassName={
                    vehicle.batteryVoltage != null ? "text-white" : "text-slate-500"
                  }
                />
                <DetailRow
                  label="External power"
                  value={formatExternalPower(vehicle.externalPower)}
                  valueClassName={
                    vehicle.externalPower === true
                      ? "text-emerald-400"
                      : vehicle.externalPower === false
                        ? "text-amber-400"
                        : "text-slate-500"
                  }
                />
                <DetailRow
                  label="GSM signal"
                  value={formatGsmSignal(vehicle.gsmSignal)}
                  valueClassName={
                    vehicle.gsmSignal != null ? "text-white" : "text-slate-500"
                  }
                />
                <DetailRow
                  label="Satellites"
                  value={formatSatellites(vehicle.satellites)}
                  valueClassName={
                    vehicle.satellites != null ? "text-white" : "text-slate-500"
                  }
                />
              </dl>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
