"use client";

import { useSgeStore } from "@/store/sge-store";
import { getVoiceMessage } from "@/engines/sge";

export function VoiceLog() {
  const voiceLog = useSgeStore((s) => s.voiceLog);
  const isActive = useSgeStore((s) => s.isActive);
  const focusedVehicleId = useSgeStore((s) => s.focusedVehicleId);

  if (!isActive || voiceLog.length === 0) return null;

  const filtered = focusedVehicleId
    ? voiceLog.filter((v) => v.vehicleId === focusedVehicleId)
    : voiceLog;
  const recent = filtered.slice(-5).reverse();

  if (recent.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-navy-900/50 p-3">
      <h4 className="mb-2 text-xs font-semibold text-slate-300">Voice Events</h4>
      <ul className="space-y-1">
        {recent.map((entry, i) => (
          <li key={`${entry.timestamp}-${i}`} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 text-slate-500">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-slate-300">{getVoiceMessage(entry.event)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
