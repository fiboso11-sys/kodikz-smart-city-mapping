"use client";

import { useEffect, useMemo, useState } from "react";
import { useFleetVehicles } from "@/hooks/use-vehicles";
import { useGisStore } from "@/store/gis-store";
import { useSgeStore } from "@/store/sge-store";
import { useRouteAssignmentStore } from "@/store/route-assignment-store";
import {
  alertCenter,
  assignmentManager,
  voiceCopilot,
} from "@/platform/sge";
import type { BlockageReason } from "@/engines/sge";
import { CopilotStatusHero } from "@/components/copilot/status-hero";
import { CopilotActionButton } from "@/components/copilot/action-button";
import { CopilotBlockageDialog } from "@/components/copilot/blockage-dialog";
import { CopilotMetricGrid } from "@/components/copilot/metric-grid";
import { CopilotVoicePanel } from "@/components/copilot/voice-panel";
import { RouteAssigner } from "@/components/sge/route-assigner";

type Tab = "home" | "progress" | "voice";

function gpsLabel(accuracy: number | undefined): string {
  if (accuracy == null) return "—";
  if (accuracy <= 10) return "GOOD";
  if (accuracy <= 25) return "FAIR";
  if (accuracy <= 40) return "POOR";
  return "LOST";
}

export default function SurveyCopilotPage() {
  const hydrate = useSgeStore((s) => s.hydrate);
  const byVehicle = useSgeStore((s) => s.byVehicle);
  const focusedVehicleId = useSgeStore((s) => s.focusedVehicleId);
  const setFocusedVehicle = useSgeStore((s) => s.setFocusedVehicle);
  const pause = useSgeStore((s) => s.pause);
  const resume = useSgeStore((s) => s.resume);
  const endSession = useSgeStore((s) => s.endSession);
  const reportBlockage = useSgeStore((s) => s.reportBlockage);
  const refreshAssignments = useRouteAssignmentStore((s) => s.refresh);
  const pauseAssignment = useRouteAssignmentStore((s) => s.pauseAssignment);
  const resumeAssignment = useRouteAssignmentStore((s) => s.resumeAssignment);
  const connectionStatus = useGisStore((s) => s.connectionStatus);
  const liveByImei = useGisStore((s) => s.liveByImei);

  const { vehicles } = useFleetVehicles();
  const [tab, setTab] = useState<Tab>("home");
  const [blockageOpen, setBlockageOpen] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);

  useEffect(() => {
    hydrate();
    refreshAssignments();
  }, [hydrate, refreshAssignments]);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; addEventListener: Function }>;
    };
    if (!nav.getBattery) return;
    void nav.getBattery().then((b) => {
      setBattery(Math.round(b.level * 100));
      b.addEventListener("levelchange", () => setBattery(Math.round(b.level * 100)));
    });
  }, []);

  const activeIds = Object.keys(byVehicle);
  const vehicleId = focusedVehicleId && byVehicle[focusedVehicleId]
    ? focusedVehicleId
    : activeIds[0] ?? null;

  useEffect(() => {
    if (vehicleId && focusedVehicleId !== vehicleId) {
      setFocusedVehicle(vehicleId);
    }
  }, [vehicleId, focusedVehicleId, setFocusedVehicle]);

  const view = vehicleId ? byVehicle[vehicleId] : null;
  const decision = view?.decision ?? null;
  const session = view?.session ?? null;
  const assignment = vehicleId
    ? assignmentManager.getActiveForVehicle(vehicleId)
    : undefined;
  const vehicleMeta = vehicles.find((v) => v.imei === vehicleId);
  const live = vehicleId ? liveByImei[vehicleId] : undefined;

  const segments = session?.segments.segments ?? [];
  const completedSegs = segments.filter((s) => s.completed).length;
  const remainingSegs = segments.length - completedSegs;
  const currentSeg = decision?.segmentId ?? "—";
  const nextSeg = decision?.nextSegmentId ?? "—";

  const progressStats = useMemo(() => {
    const completedM = decision?.completedLengthMetres ?? 0;
    const remainingM = decision?.remainingLengthMetres ?? 0;
    const quality = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (decision?.completionPct ?? 0) * 0.7 +
            (decision?.wrongDirection ? 0 : 20) +
            (decision && decision.distanceFromRoute <= 15 ? 10 : 0)
        )
      )
    );
    return { completedM, remainingM, quality };
  }, [decision]);

  const onBlockage = (reason: BlockageReason, notes: string) => {
    if (!vehicleId || !decision) return;
    reportBlockage(reason, decision.latitude, decision.longitude, notes, vehicleId);
    voiceCopilot.enqueue("BLOCKAGE_RECORDED");
  };

  const emergency = () => {
    if (!vehicleId || !assignment) return;
    alertCenter.create({
      tenantId: assignment.tenantId,
      assignmentId: assignment.id,
      vehicleId,
      severity: "CRITICAL",
      category: "SYSTEM",
      message: "EMERGENCY — driver pressed emergency button",
      payload: { source: "EMERGENCY" },
    });
    voiceCopilot.enqueue("EMERGENCY");
  };
  if (!vehicleId || !view) {
    return (
      <div className="copilot-shell mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-4 p-4 pb-8">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gis-blue-light">
            Kodikz Survey Copilot
          </p>
          <h1 className="mt-1 text-2xl font-black text-white">Start a Survey</h1>
          <p className="mt-1 text-sm text-slate-400">
            Select a vehicle and assign a route to begin guidance.
          </p>
        </header>

        <div className="space-y-3">
          {vehicles.slice(0, 12).map((v) => (
            <div
              key={v.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="font-bold text-white">{v.vehicleName}</p>
              <p className="text-xs text-slate-500">
                {v.plateNumber} · {v.imei}
              </p>
              <div className="mt-3">
                <RouteAssigner vehicleId={v.imei} vehicleName={v.vehicleName} />
              </div>
            </div>
          ))}
          {vehicles.length === 0 && (
            <p className="text-sm text-slate-500">No vehicles available.</p>
          )}
        </div>
      </div>
    );
  }

  const isPaused = view.routeState === "PAUSED";

  return (
    <div className="copilot-shell mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-4 p-4 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gis-blue-light">
            Survey Copilot
          </p>
          <h1 className="text-lg font-black text-white">
            {vehicleMeta?.vehicleName ?? vehicleId}
          </h1>
          <p className="text-xs text-slate-500">
            {assignment?.routeName ?? "Active survey"} · {connectionStatus}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2 text-center text-xs">
          <p className="text-slate-500">Battery</p>
          <p className="font-bold text-white">{battery != null ? `${battery}%` : "—"}</p>
        </div>
      </header>

      <nav className="grid grid-cols-3 gap-2">
        {(["home", "progress", "voice"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-[44px] rounded-xl text-sm font-bold capitalize ${
              tab === t
                ? "bg-gis-blue/25 text-gis-blue-light"
                : "bg-white/5 text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <>
          <CopilotStatusHero
            routeState={view.routeState}
            completionPct={view.completionPct}
            remainingMetres={view.remainingMetres}
            currentRoad={decision?.currentRoad ?? "—"}
            gpsQuality={gpsLabel(decision?.gpsAccuracy)}
          />

          <CopilotMetricGrid
            items={[
              { label: "Current Segment", value: String(currentSeg) },
              { label: "Next Segment", value: String(nextSeg) },
              {
                label: "Speed",
                value: live ? `${live.speed.toFixed(0)} km/h` : "—",
              },
              {
                label: "Heading",
                value: decision ? `${decision.heading.toFixed(0)}°` : "—",
              },
              {
                label: "Deviation",
                value: `${view.distanceFromRoute.toFixed(0)} m`,
              },
              {
                label: "Network",
                value: connectionStatus === "CONNECTED" ? "ONLINE" : connectionStatus,
              },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            {isPaused ? (
              <CopilotActionButton
                label="Resume Survey"
                variant="success"
                onClick={() => {
                  // Persist via survey API when an assignment exists; local-only pause
                  // does not survive refresh (server status never becomes PAUSED).
                  if (assignment) void resumeAssignment(assignment.id);
                  else resume(vehicleId);
                  voiceCopilot.enqueue("SURVEY_RESUMED");
                }}
              />
            ) : (
              <CopilotActionButton
                label="Pause Survey"
                variant="warn"
                onClick={() => {
                  if (assignment) void pauseAssignment(assignment.id);
                  else pause(vehicleId);
                  voiceCopilot.enqueue("SURVEY_PAUSED");
                }}
              />
            )}
            <CopilotActionButton
              label="Report Blockage"
              variant="danger"
              onClick={() => setBlockageOpen(true)}
            />
            <CopilotActionButton
              label="Need Supervisor"
              variant="default"
              onClick={() => {
                if (!assignment) return;
                alertCenter.create({
                  tenantId: assignment.tenantId,
                  assignmentId: assignment.id,
                  vehicleId,
                  severity: "WARNING",
                  category: "SYSTEM",
                  message: "Driver requested supervisor assistance",
                  payload: { source: "NEED_SUPERVISOR" },
                });
                voiceCopilot.enqueue("NEED_SUPERVISOR");
              }}
            />
            <CopilotActionButton label="Emergency" variant="danger" onClick={emergency} />
            <div className="col-span-2">
              <CopilotActionButton
                label="Finish Survey"
                variant="success"
                onClick={() => {
                  if (assignment) {
                    assignmentManager.completeSurvey(assignment.id);
                  }
                  endSession(vehicleId);
                  voiceCopilot.enqueue("SURVEY_COMPLETE");
                }}
              />
            </div>
          </div>
        </>
      )}

      {tab === "progress" && (
        <div className="space-y-3">
          <CopilotMetricGrid
            items={[
              {
                label: "Completed Distance",
                value:
                  progressStats.completedM >= 1000
                    ? `${(progressStats.completedM / 1000).toFixed(2)} km`
                    : `${progressStats.completedM.toFixed(0)} m`,
              },
              {
                label: "Remaining Distance",
                value:
                  progressStats.remainingM >= 1000
                    ? `${(progressStats.remainingM / 1000).toFixed(2)} km`
                    : `${progressStats.remainingM.toFixed(0)} m`,
              },
              { label: "Completed Segments", value: String(completedSegs) },
              { label: "Remaining Segments", value: String(remainingSegs) },
              {
                label: "Wrong Direction",
                value: view.wrongDirection ? "YES" : "NO",
              },
              {
                label: "Quality Score",
                value: `${progressStats.quality}`,
              },
            ]}
          />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Assignment
            </p>
            <p className="mt-1 font-bold text-white">{assignment?.routeName ?? "—"}</p>
            <p className="mt-1 text-xs text-slate-500">{assignment?.id ?? ""}</p>
          </div>
        </div>
      )}

      {tab === "voice" && <CopilotVoicePanel vehicleId={vehicleId} />}

      <CopilotBlockageDialog
        open={blockageOpen}
        onClose={() => setBlockageOpen(false)}
        onSubmit={onBlockage}
      />
    </div>
  );
}
