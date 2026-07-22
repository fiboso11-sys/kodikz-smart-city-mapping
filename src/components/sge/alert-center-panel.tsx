"use client";

import { useSgeStore } from "@/store/sge-store";
import { alertCenter, type AlertSeverity } from "@/platform/sge";

const SEV: Record<AlertSeverity, string> = {
  INFO: "text-slate-300",
  WARNING: "text-amber-300",
  CRITICAL: "text-red-300",
};

export function AlertCenterPanel() {
  const alerts = useSgeStore((s) => s.alerts);
  const acknowledgeAlert = useSgeStore((s) => s.acknowledgeAlert);
  const dismissAlert = useSgeStore((s) => s.dismissAlert);

  const open = alerts.filter((a) => a.status === "OPEN");
  const recent = alerts.slice(0, 20);

  const exportAlerts = () => {
    const csv = alertCenter.exportCsv({ status: "OPEN" });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sge-alerts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-gold/10 bg-navy-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Alert Center ({open.length} open)
        </h3>
        <button
          type="button"
          onClick={exportAlerts}
          className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:bg-white/10"
        >
          Export CSV
        </button>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-slate-500">No alerts.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-auto">
          {recent.map((a) => (
            <div
              key={a.id}
              className="rounded border border-white/5 bg-white/[0.03] px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`font-medium ${SEV[a.severity]}`}>
                  {a.severity} · {a.category.replace(/_/g, " ")}
                </span>
                <span className="text-slate-500">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 text-slate-300">{a.message}</p>
              <p className="mt-0.5 text-slate-500">
                Vehicle {a.vehicleId} · {a.status}
              </p>
              {a.status === "OPEN" && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => acknowledgeAlert(a.id, "supervisor")}
                    className="rounded bg-gis-blue/20 px-2 py-1 text-[10px] text-gis-blue-light"
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissAlert(a.id, "supervisor")}
                    className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-400"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
