"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/maps/MapView";
import { AlertCenterPanel } from "@/components/sge/alert-center-panel";
import { useFleetVehicles } from "@/hooks/use-vehicles";
import { useGeoUploads } from "@/hooks/use-permits";
import { useGisStore } from "@/store/gis-store";
import { useSgeStore } from "@/store/sge-store";
import { useRouteAssignmentStore } from "@/store/route-assignment-store";
import {
  assignmentManager,
  buildSurveyTimeline,
  offlineQueue,
  alertCenter,
} from "@/platform/sge";
import { sendSupervisorCommand } from "@/services/survey/commands";
import type { RouteState } from "@/engines/sge";
import { cn } from "@/lib/utils";

function gpsQuality(acc?: number): string {
  if (acc == null) return "—";
  if (acc <= 10) return "GOOD";
  if (acc <= 25) return "FAIR";
  if (acc <= 40) return "POOR";
  return "LOST";
}

const STATE_DOT: Record<RouteState, string> = {
  NOT_STARTED: "bg-slate-400",
  ON_ROUTE: "bg-emerald-400",
  WARNING: "bg-amber-400",
  OFF_ROUTE: "bg-red-500",
  RETURNING: "bg-blue-400",
  PAUSED: "bg-slate-500",
  COMPLETED: "bg-emerald-500",
  GPS_UNRELIABLE: "bg-orange-400",
};

export default function SupervisorCommandCenterPage() {
  const hydrate = useSgeStore((s) => s.hydrate);
  const byVehicle = useSgeStore((s) => s.byVehicle);
  const setFocusedVehicle = useSgeStore((s) => s.setFocusedVehicle);
  const focusedVehicleId = useSgeStore((s) => s.focusedVehicleId);
  const pause = useSgeStore((s) => s.pause);
  const resume = useSgeStore((s) => s.resume);
  const endSession = useSgeStore((s) => s.endSession);
  const voiceLog = useSgeStore((s) => s.voiceLog);
  const blockageReports = useSgeStore((s) => s.blockageReports);
  const alerts = useSgeStore((s) => s.alerts);
  const decisions = useSgeStore((s) => s.decisions);
  const refresh = useRouteAssignmentStore((s) => s.refresh);
  const assignments = useRouteAssignmentStore((s) => s.assignments);

  const { vehicles } = useFleetVehicles();
  const { data: geoUploads = [] } = useGeoUploads();
  const setSelectedVehicleId = useGisStore((s) => s.setSelectedVehicleId);
  const selectedVehicleId = useGisStore((s) => s.selectedVehicleId);

  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    hydrate();
    refresh();
  }, [hydrate, refresh]);

  // Refresh timeline periodically from event bus
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    return Object.values(byVehicle).map((v) => {
      const meta = vehicles.find((x) => x.imei === v.vehicleId);
      const a = assignmentManager.getActiveForVehicle(v.vehicleId);
      const openAlerts = alerts.filter(
        (al) => al.vehicleId === v.vehicleId && al.status === "OPEN"
      ).length;
      return {
        ...v,
        driver: meta?.driverName ?? "—",
        plate: meta?.plateNumber ?? v.vehicleId,
        vehicleName: meta?.vehicleName ?? v.vehicleId,
        assignmentName: a?.routeName ?? "—",
        openAlerts,
      };
    });
  }, [byVehicle, vehicles, alerts]);

  const kpis = useMemo(() => {
    const all = Object.values(byVehicle);
    const asg = assignments.filter((a) =>
      ["ACTIVE", "PAUSED", "ASSIGNED", "COMPLETED"].includes(a.status)
    );
    return {
      total: Math.max(asg.length, all.length),
      active: all.filter((v) => v.routeState === "ON_ROUTE" || v.routeState === "RETURNING").length,
      completed: assignments.filter((a) => a.status === "COMPLETED").length,
      paused: all.filter((v) => v.routeState === "PAUSED").length,
      offRoute: all.filter((v) => v.routeState === "OFF_ROUTE").length,
      warnings: all.filter((v) => v.routeState === "WARNING").length,
      gpsLost: all.filter((v) => v.routeState === "GPS_UNRELIABLE").length,
      blockages: blockageReports.length,
    };
  }, [byVehicle, assignments, blockageReports]);

  const selectedImei =
    focusedVehicleId && byVehicle[focusedVehicleId]
      ? focusedVehicleId
      : rows[0]?.vehicleId ?? null;

  const selectedView = selectedImei ? byVehicle[selectedImei] : null;
  const selectedMeta = vehicles.find((v) => v.imei === selectedImei);
  const selectedAssignment = selectedImei
    ? assignmentManager.getActiveForVehicle(selectedImei)
    : undefined;
  const timeline = buildSurveyTimeline({
    vehicleId: selectedImei ?? undefined,
    limit: 40,
  });
  void tick;

  const selectVehicle = (imei: string) => {
    setFocusedVehicle(imei);
    const meta = vehicles.find((v) => v.imei === imei);
    if (meta) setSelectedVehicleId(meta.id);
  };

  const sendMessage = () => {
    if (!selectedImei || !selectedAssignment || !message.trim()) return;
    const text = message.trim();
    void sendSupervisorCommand({
      type: "SEND_MESSAGE",
      tenantId: selectedAssignment.tenantId,
      assignmentId: selectedAssignment.id,
      vehicleId: selectedImei,
      issuedBy: "supervisor",
      message: text,
    });
    alertCenter.create({
      tenantId: selectedAssignment.tenantId,
      assignmentId: selectedAssignment.id,
      vehicleId: selectedImei,
      severity: "INFO",
      category: "SYSTEM",
      message: `Supervisor message: ${text}`,
      payload: { source: "SUPERVISOR_MESSAGE" },
    });
    setMessage("");
  };

  return (
    <div className="flex h-[100dvh] flex-col md:h-screen">
      <PageHeader
        title="Supervisor Command Center"
        subtitle="Live survey operations — Air-traffic style oversight"
      />

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-gold/10 px-3 py-3 sm:grid-cols-4 lg:grid-cols-8">
        {[
          ["Total Surveys", kpis.total],
          ["Active", kpis.active],
          ["Completed", kpis.completed],
          ["Paused", kpis.paused],
          ["Off Route", kpis.offRoute],
          ["Warnings", kpis.warnings],
          ["GPS Lost", kpis.gpsLost],
          ["Blockages", kpis.blockages],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-gold/10 bg-navy-900/60 px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {offlineQueue.getPending().length > 0 && (
        <div className="border-b border-amber-700/30 bg-amber-900/20 px-4 py-2 text-xs text-amber-200">
          Offline queue: {offlineQueue.getPending().length} pending
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1fr_340px]">
        <div className="flex min-h-0 flex-col">
          <div className="map-shell min-h-[280px] p-3 xl:min-h-0 xl:flex-1">
            <MapView
              vehicles={vehicles}
              geoUploadRecords={geoUploads}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={(id) => {
                setSelectedVehicleId(id);
                const v = vehicles.find((x) => x.id === id);
                if (v) setFocusedVehicle(v.imei);
              }}
              className="h-full"
            />
          </div>

          <div className="max-h-[240px] overflow-auto border-t border-gold/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-navy-950 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2">Assignment</th>
                  <th className="px-3 py-2">Road</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">%</th>
                  <th className="px-3 py-2">Dev</th>
                  <th className="px-3 py-2">Remain</th>
                  <th className="px-3 py-2">GPS</th>
                  <th className="px-3 py-2">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                      No active surveys. Assign a route from Dashboard or Survey Copilot.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.vehicleId}
                      onClick={() => selectVehicle(r.vehicleId)}
                      className={cn(
                        "cursor-pointer border-t border-white/5 hover:bg-white/[0.04]",
                        selectedImei === r.vehicleId && "bg-gis-blue/10"
                      )}
                    >
                      <td className="px-3 py-2 font-medium text-white">{r.plate}</td>
                      <td className="px-3 py-2 text-slate-300">{r.driver}</td>
                      <td className="max-w-[120px] truncate px-3 py-2 text-slate-400">
                        {r.assignmentName}
                      </td>
                      <td className="max-w-[100px] truncate px-3 py-2 text-slate-400">
                        {r.decision?.currentRoad ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-slate-200">
                          <span className={`h-2 w-2 rounded-full ${STATE_DOT[r.routeState]}`} />
                          {r.routeState.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{r.completionPct.toFixed(0)}%</td>
                      <td className="px-3 py-2 text-slate-300">
                        {r.distanceFromRoute.toFixed(0)}m
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {r.remainingMetres >= 1000
                          ? `${(r.remainingMetres / 1000).toFixed(1)}km`
                          : `${r.remainingMetres.toFixed(0)}m`}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {gpsQuality(r.decision?.gpsAccuracy)}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{r.openAlerts}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-auto border-t border-gold/10 p-3 xl:border-l xl:border-t-0">
          {!selectedView ? (
            <p className="text-sm text-slate-500">Select a vehicle to inspect.</p>
          ) : (
            <>
              <div className="rounded-xl border border-gold/10 bg-navy-900/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Vehicle</p>
                <h3 className="text-base font-bold text-white">
                  {selectedMeta?.vehicleName ?? selectedImei}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedMeta?.driverName ?? "—"} · {selectedMeta?.permitNumber ?? "—"}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  {selectedAssignment?.routeName ?? "No assignment"} ·{" "}
                  {selectedView.routeState.replace(/_/g, " ")}
                </p>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, selectedView.completionPct)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedView.completionPct.toFixed(1)}% complete
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Cmd
                  label="Pause"
                  onClick={() => {
                    if (!selectedImei || !selectedAssignment) return;
                    void sendSupervisorCommand({
                      type: "PAUSE",
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      issuedBy: "supervisor",
                    }).then(() => pause(selectedImei));
                  }}
                />
                <Cmd
                  label="Resume"
                  onClick={() => {
                    if (!selectedImei || !selectedAssignment) return;
                    void sendSupervisorCommand({
                      type: "RESUME",
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      issuedBy: "supervisor",
                    }).then(() => resume(selectedImei));
                  }}
                />
                <Cmd
                  label="Cancel"
                  danger
                  onClick={() => {
                    if (!selectedImei || !selectedAssignment) return;
                    void sendSupervisorCommand({
                      type: "CANCEL",
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      issuedBy: "supervisor",
                    }).then(() => endSession(selectedImei));
                  }}
                />
                <Cmd
                  label="Request Return"
                  onClick={() => {
                    if (!selectedImei || !selectedAssignment) return;
                    void sendSupervisorCommand({
                      type: "REQUEST_RETURN",
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      issuedBy: "supervisor",
                      message: "Return to assigned route",
                    });
                    alertCenter.create({
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      severity: "WARNING",
                      category: "ROUTE_DEVIATION",
                      message: "Supervisor requested return to assigned route",
                      payload: { source: "REQUEST_RETURN" },
                    });
                  }}
                />
                <Cmd
                  label="Approve Diversion"
                  onClick={() => {
                    if (!selectedImei || !selectedAssignment) return;
                    void sendSupervisorCommand({
                      type: "APPROVE_DIVERSION",
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      issuedBy: "supervisor",
                    });
                    alertCenter.create({
                      tenantId: selectedAssignment.tenantId,
                      assignmentId: selectedAssignment.id,
                      vehicleId: selectedImei,
                      severity: "INFO",
                      category: "SYSTEM",
                      message: "Diversion approved by supervisor",
                      payload: { source: "APPROVE_DIVERSION" },
                    });
                  }}
                />
                <Cmd
                  label="Ack Alerts"
                  onClick={() => {
                    alerts
                      .filter((a) => a.vehicleId === selectedImei && a.status === "OPEN")
                      .forEach((a) => {
                        alertCenter.acknowledge(a.id, "supervisor");
                        void useSgeStore.getState().acknowledgeAlert(a.id, "supervisor");
                      });
                    useSgeStore.getState().refreshAlerts();
                  }}
                />
              </div>

              <div className="rounded-xl border border-gold/10 bg-navy-900/50 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                  Send Message
                </p>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message to driver…"
                    className="flex-1 rounded-lg border border-white/10 bg-navy-950 px-2 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="rounded-lg bg-gis-blue/25 px-3 text-xs font-semibold text-gis-blue-light"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gold/10 bg-navy-900/50 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                  Timeline
                </p>
                <div className="max-h-40 space-y-1.5 overflow-auto">
                  {timeline.length === 0 ? (
                    <p className="text-xs text-slate-500">No events yet.</p>
                  ) : (
                    timeline.map((t) => (
                      <div key={t.id} className="flex gap-2 text-xs">
                        <span className="shrink-0 text-slate-500">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-slate-200">{t.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gold/10 bg-navy-900/50 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                  Decision History
                </p>
                <div className="max-h-28 space-y-1 overflow-auto text-xs text-slate-300">
                  {decisions
                    .filter((d) => d.vehicleId === selectedImei)
                    .slice(-8)
                    .reverse()
                    .map((d) => (
                      <div key={d.id}>
                        {new Date(d.timestamp).toLocaleTimeString()} · {d.routeState} ·{" "}
                        {d.completionPct.toFixed(0)}% · {d.distanceFromRoute.toFixed(0)}m
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-xl border border-gold/10 bg-navy-900/50 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                  Voice / Blockages
                </p>
                <p className="text-xs text-slate-400">
                  Voice events:{" "}
                  {voiceLog.filter((v) => v.vehicleId === selectedImei).length} · Blockages:{" "}
                  {blockageReports.filter((b) => b.vehicleId === selectedImei).length}
                </p>
              </div>
            </>
          )}

          <AlertCenterPanel />
        </aside>
      </div>
    </div>
  );
}

function Cmd({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[40px] rounded-lg px-2 text-xs font-semibold",
        danger
          ? "bg-red-900/40 text-red-300"
          : "bg-white/5 text-slate-200 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}
