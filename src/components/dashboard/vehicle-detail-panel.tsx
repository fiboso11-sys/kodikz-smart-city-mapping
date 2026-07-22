"use client";

import { useEffect } from "react";
import { liveStatusColor, liveStatusLabel } from "@/lib/vehicle-status";
import { formatSpeed, formatTime } from "@/lib/utils";
import type { VehicleWithLive } from "@/types";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { SurveyStatusPanel } from "@/components/sge/survey-status-panel";
import { RouteAssigner } from "@/components/sge/route-assigner";
import { BlockageReporter } from "@/components/sge/blockage-reporter";
import { VoiceLog } from "@/components/sge/voice-log";
import { useSgeStore } from "@/store/sge-store";

interface VehicleDetailPanelProps {
  vehicle: VehicleWithLive | null;
  onClose: () => void;
}

export function VehicleDetailPanel({ vehicle, onClose }: VehicleDetailPanelProps) {
  const byVehicle = useSgeStore((s) => s.byVehicle);
  const setFocusedVehicle = useSgeStore((s) => s.setFocusedVehicle);

  useEffect(() => {
    if (vehicle?.imei) setFocusedVehicle(vehicle.imei);
  }, [vehicle?.imei, setFocusedVehicle]);

  if (!vehicle) {
    return (
      <div className="command-panel flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
        Select a vehicle on the map or search to view details
      </div>
    );
  }

  const live = vehicle.live;
  const statusColor = liveStatusColor(vehicle.liveStatus);
  const showSge = Boolean(byVehicle[vehicle.imei]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="command-panel flex h-full flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Selected Vehicle</p>
          <h3 className="font-semibold text-white">{vehicle.vehicleName}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
          <span className="font-medium text-white">{liveStatusLabel(vehicle.liveStatus)}</span>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 p-3">
          <RouteAssigner vehicleId={vehicle.imei} vehicleName={vehicle.vehicleName} />
          {showSge && <SurveyStatusPanel />}
          {showSge && <BlockageReporter />}
          {showSge && <VoiceLog />}
        </div>

        <DetailRow label="IMEI" value={vehicle.imei} mono />
        <DetailRow label="Plate Number" value={vehicle.plateNumber} />
        <DetailRow label="Company" value={vehicle.companyName} />
        <DetailRow label="Permit Number" value={vehicle.permitNumber} />
        <DetailRow label="Driver" value={vehicle.driverName} />
        <DetailRow label="Driver Mobile" value={vehicle.driverMobile || "—"} />
        <DetailRow label="Vehicle Type" value={vehicle.vehicleType} />
        <DetailRow label="Master Status" value={vehicle.status} />
        <DetailRow label="Speed" value={live ? formatSpeed(live.speed) : "—"} />
        <DetailRow
          label="Ignition"
          value={
            live?.ignition === null || live?.ignition === undefined
              ? "—"
              : live.ignition
                ? "ON"
                : "OFF"
          }
        />
        <DetailRow label="Last Update" value={live ? formatTime(live.timestamp) : "No GPS fix"} />
        <DetailRow label="Latitude" value={live ? live.latitude.toFixed(6) : "—"} mono />
        <DetailRow label="Longitude" value={live ? live.longitude.toFixed(6) : "—"} mono />
        {vehicle.notes && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Notes</p>
            <p className="mt-1 text-slate-300">{vehicle.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-slate-200 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
