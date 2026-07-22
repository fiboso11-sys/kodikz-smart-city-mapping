/**
 * SGE Store — reactive façade over Session Manager + Decision Bus.
 * Supports multiple concurrent vehicle sessions.
 * SGE engine remains the only decision source.
 */

"use client";

import { create } from "zustand";
import type {
  BlockageReport,
  CompletionStatus,
  GpsPoint,
  HeadingStatus,
  RouteState,
  SgeSessionState,
  VoiceEvent,
  BlockageReason,
} from "@/engines/sge";
import type { SurveyAssignment, SurveyDecision, SupervisorAlert } from "@/platform/sge";
import {
  assignmentManager,
  sessionManager,
  decisionBus,
  alertCenter,
  roadResolver,
  offlineQueue,
  driverCopilot,
  bootstrapSgePlatform,
} from "@/platform/sge";

export interface VehicleSurveyView {
  vehicleId: string;
  assignmentId: string;
  routeState: RouteState;
  completionPct: number;
  completionStatus: CompletionStatus;
  headingStatus: HeadingStatus;
  distanceFromRoute: number;
  remainingMetres: number;
  wrongDirection: boolean;
  decision: SurveyDecision | null;
  session: SgeSessionState | null;
}

interface SgeStoreState {
  /** Multi-vehicle reactive views */
  byVehicle: Record<string, VehicleSurveyView>;
  /** Focused vehicle for driver panel (selected) */
  focusedVehicleId: string | null;
  voiceLog: Array<{ vehicleId: string; event: VoiceEvent; timestamp: number }>;
  blockageReports: BlockageReport[];
  alerts: SupervisorAlert[];
  decisions: SurveyDecision[];
  hydrated: boolean;

  /** Convenience getters mirroring 2.1b for focused vehicle */
  session: SgeSessionState | null;
  latestSnapshot: SurveyDecision | null;
  routeState: RouteState;
  completionPct: number;
  completionStatus: CompletionStatus;
  headingStatus: HeadingStatus;
  distanceFromRoute: number;
  remainingMetres: number;
  wrongDirection: boolean;
  isActive: boolean;

  hydrate: () => void;
  setFocusedVehicle: (vehicleId: string | null) => void;
  startFromAssignment: (assignment: SurveyAssignment) => void;
  endSession: (vehicleId?: string) => void;
  feedGps: (vehicleId: string, gps: GpsPoint) => void;
  pause: (vehicleId?: string) => void;
  resume: (vehicleId?: string) => void;
  reportBlockage: (
    reason: BlockageReason,
    lat: number,
    lon: number,
    notes?: string,
    vehicleId?: string
  ) => void;
  acknowledgeAlert: (alertId: string, by: string) => void;
  dismissAlert: (alertId: string, by: string) => void;
  refreshAlerts: () => void;
}

function emptyView(vehicleId: string, assignmentId = ""): VehicleSurveyView {
  return {
    vehicleId,
    assignmentId,
    routeState: "NOT_STARTED",
    completionPct: 0,
    completionStatus: "NOT_STARTED",
    headingStatus: "CORRECT",
    distanceFromRoute: 0,
    remainingMetres: 0,
    wrongDirection: false,
    decision: null,
    session: null,
  };
}

function viewFromDecision(
  decision: SurveyDecision,
  session: SgeSessionState | null
): VehicleSurveyView {
  return {
    vehicleId: decision.vehicleId,
    assignmentId: decision.assignmentId,
    routeState: decision.routeState,
    completionPct: decision.completionPct,
    completionStatus: decision.completionStatus,
    headingStatus: decision.headingStatus,
    distanceFromRoute: decision.distanceFromRoute,
    remainingMetres: decision.remainingLengthMetres,
    wrongDirection: decision.wrongDirection,
    decision,
    session,
  };
}

function focusedSlice(state: {
  byVehicle: Record<string, VehicleSurveyView>;
  focusedVehicleId: string | null;
}) {
  const id = state.focusedVehicleId;
  const view = id ? state.byVehicle[id] : null;
  const firstId = Object.keys(state.byVehicle)[0] ?? null;
  const fallback = firstId ? state.byVehicle[firstId] : null;
  const active = view ?? fallback;

  return {
    session: active?.session ?? null,
    latestSnapshot: active?.decision ?? null,
    routeState: active?.routeState ?? ("NOT_STARTED" as RouteState),
    completionPct: active?.completionPct ?? 0,
    completionStatus: active?.completionStatus ?? ("NOT_STARTED" as CompletionStatus),
    headingStatus: active?.headingStatus ?? ("CORRECT" as HeadingStatus),
    distanceFromRoute: active?.distanceFromRoute ?? 0,
    remainingMetres: active?.remainingMetres ?? 0,
    wrongDirection: active?.wrongDirection ?? false,
    isActive: Object.keys(state.byVehicle).length > 0,
  };
}

/** Throttle decision persistence — state changes always sync; otherwise ≥5s. */
const lastDecisionSync = new Map<string, { at: number; state: string }>();

function shouldPersistDecision(decision: SurveyDecision): boolean {
  const key = decision.vehicleId;
  const stateKey = `${decision.routeState}:${decision.wrongDirection}:${Math.floor(decision.completionPct)}`;
  const prev = lastDecisionSync.get(key);
  const now = Date.now();
  if (!prev || prev.state !== stateKey || now - prev.at >= 5000) {
    lastDecisionSync.set(key, { at: now, state: stateKey });
    return true;
  }
  return false;
}

export const useSgeStore = create<SgeStoreState>((set, get) => ({
  byVehicle: {},
  focusedVehicleId: null,
  voiceLog: [],
  blockageReports: [],
  alerts: [],
  decisions: [],
  hydrated: false,

  session: null,
  latestSnapshot: null,
  routeState: "NOT_STARTED",
  completionPct: 0,
  completionStatus: "NOT_STARTED",
  headingStatus: "CORRECT",
  distanceFromRoute: 0,
  remainingMetres: 0,
  wrongDirection: false,
  isActive: false,

  hydrate: () => {
    if (get().hydrated) return;
    bootstrapSgePlatform();

    const byVehicle: Record<string, VehicleSurveyView> = {};
    for (const vehicleId of sessionManager.getActiveVehicleIds()) {
      const session = sessionManager.getSession(vehicleId) ?? null;
      const decision = decisionBus.getLatest(vehicleId);
      const assignment = assignmentManager.getActiveForVehicle(vehicleId);
      if (decision) {
        byVehicle[vehicleId] = viewFromDecision(decision, session);
      } else if (session && assignment) {
        byVehicle[vehicleId] = {
          ...emptyView(vehicleId, assignment.id),
          session,
          remainingMetres: session.segments.totalLengthMetres,
        };
      }
    }

    const focusedVehicleId = Object.keys(byVehicle)[0] ?? null;
    if (focusedVehicleId) {
      driverCopilot.attach(focusedVehicleId);
    }

    set({
      byVehicle,
      focusedVehicleId,
      hydrated: true,
      alerts: alertCenter.getAll(),
      decisions: decisionBus.getAllLatest(),
      ...focusedSlice({ byVehicle, focusedVehicleId }),
    });
  },

  setFocusedVehicle: (vehicleId) => {
    if (vehicleId) driverCopilot.attach(vehicleId);
    else driverCopilot.detach();
    set((s) => ({
      focusedVehicleId: vehicleId,
      ...focusedSlice({ byVehicle: s.byVehicle, focusedVehicleId: vehicleId }),
    }));
  },

  startFromAssignment: (assignment) => {
    const session = sessionManager.startSession(assignment);
    driverCopilot.attach(assignment.vehicleId);

    set((s) => {
      const view: VehicleSurveyView = {
        ...emptyView(assignment.vehicleId, assignment.id),
        session,
        remainingMetres: session.segments.totalLengthMetres,
      };
      const byVehicle = { ...s.byVehicle, [assignment.vehicleId]: view };
      const focusedVehicleId = assignment.vehicleId;
      return {
        byVehicle,
        focusedVehicleId,
        ...focusedSlice({ byVehicle, focusedVehicleId }),
      };
    });
  },

  endSession: (vehicleId) => {
    const id = vehicleId ?? get().focusedVehicleId;
    if (!id) return;
    // Tear down SGE session only — assignment lifecycle is owned by survey API / assignmentManager.
    sessionManager.endSession(id);
    if (get().focusedVehicleId === id) driverCopilot.detach();

    set((s) => {
      const byVehicle = { ...s.byVehicle };
      delete byVehicle[id];
      const focusedVehicleId =
        s.focusedVehicleId === id
          ? Object.keys(byVehicle)[0] ?? null
          : s.focusedVehicleId;
      return {
        byVehicle,
        focusedVehicleId,
        ...focusedSlice({ byVehicle, focusedVehicleId }),
      };
    });
  },

  feedGps: (vehicleId, gps) => {
    const decision = sessionManager.feedGps(vehicleId, gps);
    if (!decision) return;

    // Async road resolve (cached) — does not block decision publish
    const peek = roadResolver.peek(gps.latitude, gps.longitude);
    if (!peek) {
      void roadResolver.resolve(gps.latitude, gps.longitude);
    }

    const session = sessionManager.getSession(vehicleId) ?? null;

    // Persist SGE decisions to production API (throttled; offline-queued)
    if (shouldPersistDecision(decision)) {
      void import("@/services/survey/client-api").then(({ surveyApi }) => {
        const persist = () =>
          surveyApi.postDecision(decision).catch(() => {
            offlineQueue.enqueue({
              type: "DECISION_SYNC",
              tenantId: decision.tenantId,
              vehicleId: decision.vehicleId,
              assignmentId: decision.assignmentId,
              payload: { decision },
            });
          });
        if (offlineQueue.isOnline()) persist();
        else {
          offlineQueue.enqueue({
            type: "DECISION_SYNC",
            tenantId: decision.tenantId,
            vehicleId: decision.vehicleId,
            assignmentId: decision.assignmentId,
            payload: { decision },
          });
        }
        void surveyApi
          .postProgress({
            assignmentId: decision.assignmentId,
            tenantId: decision.tenantId,
            vehicleId: decision.vehicleId,
            completionPct: decision.completionPct,
            completedSegmentIds:
              session?.segments.segments.filter((s) => s.completed).map((s) => s.id) ?? [],
            routeState: decision.routeState,
            updatedAt: decision.timestamp,
          })
          .catch(() => {
            offlineQueue.enqueue({
              type: "PROGRESS_SYNC",
              tenantId: decision.tenantId,
              vehicleId: decision.vehicleId,
              assignmentId: decision.assignmentId,
              payload: {
                completionPct: decision.completionPct,
                routeState: decision.routeState,
              },
            });
          });
      });
    }
    set((s) => {
      const view = viewFromDecision(
        peek ? { ...decision, currentRoad: peek } : decision,
        session
      );
      const byVehicle = { ...s.byVehicle, [vehicleId]: view };
      const voiceLog =
        decision.voiceEvent != null
          ? [
              ...s.voiceLog,
              {
                vehicleId,
                event: decision.voiceEvent,
                timestamp: decision.timestamp,
              },
            ].slice(-100)
          : s.voiceLog;

      return {
        byVehicle,
        voiceLog,
        decisions: decisionBus.getAllLatest(),
        alerts: alertCenter.getAll(),
        ...focusedSlice({
          byVehicle,
          focusedVehicleId: s.focusedVehicleId ?? vehicleId,
        }),
        focusedVehicleId: s.focusedVehicleId ?? vehicleId,
      };
    });
  },

  pause: (vehicleId) => {
    const id = vehicleId ?? get().focusedVehicleId;
    if (!id) return;
    const assignment = assignmentManager.getActiveForVehicle(id);
    if (assignment) assignmentManager.pauseSurvey(assignment.id);
    sessionManager.pause(id);
    set((s) => {
      const session = sessionManager.getSession(id) ?? null;
      const prev = s.byVehicle[id];
      if (!prev) return s;
      const byVehicle = {
        ...s.byVehicle,
        [id]: { ...prev, session, routeState: "PAUSED" as RouteState },
      };
      return {
        byVehicle,
        ...focusedSlice({ byVehicle, focusedVehicleId: s.focusedVehicleId }),
      };
    });
  },

  resume: (vehicleId) => {
    const id = vehicleId ?? get().focusedVehicleId;
    if (!id) return;
    const assignment = assignmentManager.getActiveForVehicle(id);
    if (assignment) assignmentManager.resumeSurvey(assignment.id);
    sessionManager.resume(id);
    set((s) => {
      const session = sessionManager.getSession(id) ?? null;
      const prev = s.byVehicle[id];
      if (!prev) return s;
      const byVehicle = {
        ...s.byVehicle,
        [id]: { ...prev, session },
      };
      return {
        byVehicle,
        ...focusedSlice({ byVehicle, focusedVehicleId: s.focusedVehicleId }),
      };
    });
  },

  reportBlockage: (reason, lat, lon, notes, vehicleId) => {
    const id = vehicleId ?? get().focusedVehicleId;
    if (!id) return;

    const assignment = assignmentManager.getActiveForVehicle(id);
    const report = sessionManager.reportBlockage(id, reason, lat, lon, notes);
    if (!report) return;

    const record = {
      ...report,
      tenantId: assignment?.tenantId ?? "dubai-giscd",
      photoIds: [] as string[],
    };

    void import("@/services/survey/client-api").then(({ surveyApi }) => {
      surveyApi.postBlockage(record).catch(() => {
        offlineQueue.enqueue({
          type: "BLOCKAGE_REPORT",
          tenantId: record.tenantId,
          vehicleId: id,
          assignmentId: assignment?.id ?? null,
          payload: record as unknown as Record<string, unknown>,
        });
      });
    });

    set((s) => ({
      blockageReports: [...s.blockageReports, report],
      alerts: alertCenter.getAll(),
    }));
  },

  acknowledgeAlert: (alertId, by) => {
    alertCenter.acknowledge(alertId, by);
    void import("@/services/survey/client-api").then(({ surveyApi }) => {
      surveyApi.acknowledgeAlert(alertId, by).catch(() => {
        offlineQueue.enqueue({
          type: "ALERT_ACK",
          tenantId: "dubai-giscd",
          vehicleId: "",
          assignmentId: null,
          payload: { alertId, by },
        });
      });
    });
    set({ alerts: alertCenter.getAll() });
  },

  dismissAlert: (alertId, by) => {
    alertCenter.dismiss(alertId, by);
    set({ alerts: alertCenter.getAll() });
  },

  refreshAlerts: () => set({ alerts: alertCenter.getAll() }),
}));
