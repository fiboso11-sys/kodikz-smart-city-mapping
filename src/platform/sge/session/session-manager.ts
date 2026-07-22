/**
 * Multi-Session Manager
 * Map<VehicleId, SgeSession> — isolated engine state per vehicle.
 */

import {
  createSession,
  processGpsTick,
  pauseSession,
  resumeSession,
  reportBlockage as doReportBlockage,
  type SgeSessionState,
  type GpsPoint,
  type BlockageReason,
  type BlockageReport,
  type RouteAssignment,
  type VoiceEvent,
  type RouteState,
} from "@/engines/sge";
import type { SurveyAssignment } from "../types/assignment";
import type { SurveyDecision } from "../types/decision";
import { deriveDecisionSeverity } from "../types/decision";
import { decisionBus } from "../decision-bus/decision-bus";
import { sgeEventBus } from "../event-bus/event-bus";
import { loadJson, saveJson, SGE_STORAGE_KEYS } from "../persistence/storage";
import type { SgePlatformEventType } from "../types/events";

export interface SessionProgressSnapshot {
  vehicleId: string;
  assignmentId: string;
  tenantId: string;
  completionPct: number;
  completedSegmentIds: string[];
  routeState: RouteState;
  updatedAt: number;
}

function toEngineAssignment(a: SurveyAssignment): RouteAssignment {
  return {
    id: a.id,
    vehicleId: a.vehicleId,
    routeId: a.routeId,
    routeName: a.routeName,
    geometry: a.geometry,
    assignedAt: a.createdAt,
    status:
      a.status === "COMPLETED"
        ? "completed"
        : a.status === "CANCELLED"
          ? "cancelled"
          : "active",
  };
}

function routeStateToEvent(state: RouteState): SgePlatformEventType | null {
  switch (state) {
    case "ON_ROUTE":
      return "ON_ROUTE";
    case "WARNING":
      return "WARNING";
    case "OFF_ROUTE":
      return "OFF_ROUTE";
    case "RETURNING":
      return "RETURNING";
    case "GPS_UNRELIABLE":
      return "GPS_UNRELIABLE";
    case "COMPLETED":
      return "SURVEY_COMPLETED";
    default:
      return null;
  }
}

let decisionSeq = 0;

function nextDecisionId(): string {
  decisionSeq += 1;
  return `dec-${Date.now()}-${decisionSeq}`;
}

export class SessionManager {
  /** Isolated sessions — no shared mutable state across vehicles */
  private sessions = new Map<string, SgeSessionState>();
  private tenantByVehicle = new Map<string, string>();
  private lastHeadingDiff = new Map<string, number>();

  startSession(assignment: SurveyAssignment): SgeSessionState {
    // Tenant isolation: replace only this vehicle's session
    const engineAssignment = toEngineAssignment(assignment);
    let session = createSession(assignment.vehicleId, engineAssignment);

    // Restore segment completion if persisted
    const progress = this.loadProgress(assignment.vehicleId, assignment.id);
    if (progress) {
      session = {
        ...session,
        segments: {
          ...session.segments,
          segments: session.segments.segments.map((seg) =>
            progress.completedSegmentIds.includes(seg.id)
              ? { ...seg, completed: true, gpsSamples: Math.max(seg.gpsSamples, 2) }
              : seg
          ),
        },
      };
    }

    if (assignment.status === "PAUSED") {
      session = pauseSession(session);
    }

    this.sessions.set(assignment.vehicleId, session);
    this.tenantByVehicle.set(assignment.vehicleId, assignment.tenantId);
    return session;
  }

  endSession(vehicleId: string): void {
    this.sessions.delete(vehicleId);
    this.tenantByVehicle.delete(vehicleId);
    this.lastHeadingDiff.delete(vehicleId);
    decisionBus.clearVehicle(vehicleId);
  }

  getSession(vehicleId: string): SgeSessionState | undefined {
    return this.sessions.get(vehicleId);
  }

  getAllSessions(): Map<string, SgeSessionState> {
    return new Map(this.sessions);
  }

  getActiveVehicleIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  hasSession(vehicleId: string): boolean {
    return this.sessions.has(vehicleId);
  }

  pause(vehicleId: string): void {
    const s = this.sessions.get(vehicleId);
    if (!s) return;
    this.sessions.set(vehicleId, pauseSession(s));
  }

  resume(vehicleId: string): void {
    const s = this.sessions.get(vehicleId);
    if (!s) return;
    this.sessions.set(vehicleId, resumeSession(s));
  }

  feedGps(vehicleId: string, gps: GpsPoint): SurveyDecision | null {
    const session = this.sessions.get(vehicleId);
    if (!session) return null;

    const tenantId = this.tenantByVehicle.get(vehicleId) ?? "default";
    const { snapshot, updatedSession, voiceEvents } = processGpsTick(session, gps);
    this.sessions.set(vehicleId, updatedSession);

    // Heading difference for decision object
    const headingDiff =
      snapshot.headingStatus === "CORRECT"
        ? Math.min(45, this.lastHeadingDiff.get(vehicleId) ?? 0)
        : snapshot.headingStatus === "MONITOR"
          ? 60
          : 120;
    this.lastHeadingDiff.set(vehicleId, headingDiff);

    const wrongDirection = snapshot.headingStatus === "WRONG_DIRECTION";
    const severity = deriveDecisionSeverity(snapshot.routeState, wrongDirection);

    const segments = updatedSession.segments.segments;
    const currentIdx = updatedSession.segments.currentSegmentIndex;
    const nextSeg = segments[currentIdx + 1] ?? null;

    const decision: SurveyDecision = {
      id: nextDecisionId(),
      assignmentId: snapshot.assignmentId,
      vehicleId: snapshot.vehicleId,
      tenantId,
      timestamp: snapshot.timestamp,
      routeState: snapshot.routeState,
      previousRouteState: snapshot.previousState,
      completionPct: snapshot.completionPct,
      completionStatus: snapshot.completionStatus,
      segmentId: snapshot.segmentId,
      nextSegmentId: nextSeg?.id ?? null,
      distanceFromRoute: snapshot.distanceFromRoute,
      headingDifference: headingDiff,
      headingStatus: snapshot.headingStatus,
      wrongDirection,
      gpsAccuracy: snapshot.gpsAccuracy,
      speed: snapshot.speed,
      heading: snapshot.heading,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      severity,
      voiceEvent: voiceEvents[0] ?? null,
      supervisorEvent:
        severity === "CRITICAL"
          ? snapshot.routeState
          : severity === "WARNING"
            ? snapshot.routeState
            : null,
      blockage: null,
      alerts: [],
      completedLengthMetres: snapshot.completedLengthMetres,
      remainingLengthMetres: snapshot.remainingLengthMetres,
      totalLengthMetres: snapshot.totalLengthMetres,
      currentRoad: null,
    };

    decisionBus.publish(decision);
    this.persistProgress(updatedSession, tenantId);

    // Emit platform events on state transitions
    if (snapshot.previousState !== snapshot.routeState) {
      if (
        snapshot.routeState === "ON_ROUTE" &&
        (snapshot.previousState === "OFF_ROUTE" ||
          snapshot.previousState === "RETURNING" ||
          snapshot.previousState === "WARNING")
      ) {
        sgeEventBus.publish({
          type: "BACK_ON_ROUTE",
          timestamp: gps.timestamp,
          tenantId,
          vehicleId,
          assignmentId: snapshot.assignmentId,
          severity: "INFO",
          payload: { previousState: snapshot.previousState },
        });
      } else {
        const evt = routeStateToEvent(snapshot.routeState);
        if (evt) {
          sgeEventBus.publish({
            type: evt,
            timestamp: gps.timestamp,
            tenantId,
            vehicleId,
            assignmentId: snapshot.assignmentId,
            severity:
              evt === "OFF_ROUTE" || evt === "GPS_UNRELIABLE" ? "CRITICAL" : "WARNING",
            payload: { previousState: snapshot.previousState },
          });
        }
      }
    }

    if (wrongDirection) {
      sgeEventBus.publish({
        type: "WRONG_DIRECTION",
        timestamp: gps.timestamp,
        tenantId,
        vehicleId,
        assignmentId: snapshot.assignmentId,
        severity: "CRITICAL",
        payload: { headingDifference: headingDiff },
      });
    }

    // Segment completed detection
    const newlyCompleted = updatedSession.segments.segments.filter(
      (s) =>
        s.completed &&
        !session.segments.segments.find((p) => p.id === s.id)?.completed
    );
    for (const seg of newlyCompleted) {
      sgeEventBus.publish({
        type: "SEGMENT_COMPLETED",
        timestamp: gps.timestamp,
        tenantId,
        vehicleId,
        assignmentId: snapshot.assignmentId,
        severity: "INFO",
        payload: { segmentId: seg.id, index: seg.index },
      });
    }

    return decision;
  }

  reportBlockage(
    vehicleId: string,
    reason: BlockageReason,
    lat: number,
    lon: number,
    notes?: string
  ): BlockageReport | null {
    const session = this.sessions.get(vehicleId);
    if (!session) return null;

    const { report, updatedCtx } = doReportBlockage(session.blockage, {
      vehicleId: session.vehicleId,
      assignmentId: session.assignment.id,
      routeId: session.assignment.routeId,
      latitude: lat,
      longitude: lon,
      reason,
      notes,
    });

    this.sessions.set(vehicleId, { ...session, blockage: updatedCtx });

    const tenantId = this.tenantByVehicle.get(vehicleId) ?? "default";
    sgeEventBus.publish({
      type: "BLOCKAGE_REPORTED",
      timestamp: report.timestamp,
      tenantId,
      vehicleId,
      assignmentId: report.assignmentId,
      severity: "CRITICAL",
      payload: { reason, notes: notes ?? null, latitude: lat, longitude: lon },
    });

    return report;
  }

  private persistProgress(session: SgeSessionState, tenantId: string): void {
    const all = loadJson<SessionProgressSnapshot[]>(SGE_STORAGE_KEYS.sessionProgress, []);
    const snap: SessionProgressSnapshot = {
      vehicleId: session.vehicleId,
      assignmentId: session.assignment.id,
      tenantId,
      completionPct: session.lastSnapshot?.completionPct ?? 0,
      completedSegmentIds: session.segments.segments
        .filter((s) => s.completed)
        .map((s) => s.id),
      routeState: session.stateMachine.currentState,
      updatedAt: Date.now(),
    };
    const next = all.filter(
      (p) => !(p.vehicleId === snap.vehicleId && p.assignmentId === snap.assignmentId)
    );
    next.push(snap);
    saveJson(SGE_STORAGE_KEYS.sessionProgress, next);
  }

  private loadProgress(
    vehicleId: string,
    assignmentId: string
  ): SessionProgressSnapshot | null {
    const all = loadJson<SessionProgressSnapshot[]>(SGE_STORAGE_KEYS.sessionProgress, []);
    return (
      all.find((p) => p.vehicleId === vehicleId && p.assignmentId === assignmentId) ??
      null
    );
  }
}

export const sessionManager = new SessionManager();
