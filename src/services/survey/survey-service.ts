/**
 * Production Survey Service — UI never touches persistence directly.
 * SGE remains the only source of survey *decisions*; this service persists lifecycle + sync.
 */

import { v4 as uuidv4 } from "uuid";
import { surveyRepository } from "@/lib/repositories/survey/survey-repository";
import { publishSurveyEvent } from "./event-hub";
import type {
  SurveyAssignment,
  SurveyAuditEntry,
  SurveyBlockageRecord,
  SurveyDecision,
  SurveyNotification,
  SurveyPhotoMeta,
  SurveyProgressRecord,
  SupervisorAlert,
  SupervisorCommand,
  SupervisorCommandType,
} from "./types";
import type { CreateAssignmentInput } from "@/platform/sge";
import { ACTIVE_ASSIGNMENT_STATUSES } from "@/platform/sge";

function audit(
  tenantId: string,
  actor: string,
  action: string,
  assignmentId: string | null,
  vehicleId: string | null,
  payload: Record<string, unknown> = {}
): void {
  const entry: SurveyAuditEntry = {
    id: `aud-${uuidv4()}`,
    tenantId,
    assignmentId,
    vehicleId,
    actor,
    action,
    timestamp: Date.now(),
    payload,
  };
  surveyRepository.appendAudit(entry);
}

function notify(n: Omit<SurveyNotification, "id" | "timestamp" | "read" | "acknowledged">): SurveyNotification {
  const full: SurveyNotification = {
    ...n,
    id: `ntf-${uuidv4()}`,
    timestamp: Date.now(),
    read: false,
    acknowledged: false,
  };
  surveyRepository.saveNotification(full);
  publishSurveyEvent("survey_notification", n.tenantId, { notification: full });
  return full;
}

export const surveyService = {
  listAssignments(tenantId?: string) {
    return surveyRepository.listAssignments(tenantId);
  },

  getAssignment(id: string) {
    return surveyRepository.getAssignment(id);
  },

  createAssignment(input: CreateAssignmentInput): SurveyAssignment {
    const now = Date.now();
    const assignment: SurveyAssignment = {
      id: `asg-${uuidv4()}`,
      tenantId: input.tenantId,
      vehicleId: input.vehicleId,
      driverId: input.driverId ?? null,
      routeId: input.routeId,
      routeName: input.routeName,
      permitId: input.permitId ?? null,
      surveyType: input.surveyType ?? "STREET_MAPPING",
      priority: input.priority ?? "NORMAL",
      plannedStart: input.plannedStart ?? null,
      plannedEnd: input.plannedEnd ?? null,
      actualStart: null,
      actualEnd: null,
      status: "DRAFT",
      createdBy: input.createdBy,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
      geometry: input.geometry,
    };
    surveyRepository.saveAssignment(assignment);
    audit(assignment.tenantId, input.createdBy, "Survey Assigned", assignment.id, assignment.vehicleId, {
      routeName: assignment.routeName,
    });
    notify({
      tenantId: assignment.tenantId,
      vehicleId: assignment.vehicleId,
      assignmentId: assignment.id,
      type: "SURVEY_ASSIGNED",
      title: "Survey Assigned",
      body: `Route ${assignment.routeName} assigned`,
      severity: "INFO",
      payload: { assignmentId: assignment.id },
    });
    publishSurveyEvent("survey_assignment_created", assignment.tenantId, { assignment });
    return assignment;
  },

  approveAssignment(id: string, approvedBy: string): SurveyAssignment | null {
    const a = surveyRepository.getAssignment(id);
    if (!a || a.status === "COMPLETED" || a.status === "CANCELLED") return null;
    const next: SurveyAssignment = {
      ...a,
      status: a.status === "DRAFT" ? "ASSIGNED" : a.status,
      approvedBy,
      updatedAt: Date.now(),
    };
    surveyRepository.saveAssignment(next);
    audit(next.tenantId, approvedBy, "Survey Approved", next.id, next.vehicleId);
    publishSurveyEvent("survey_assignment_updated", next.tenantId, { assignment: next });
    return next;
  },

  startAssignment(id: string, actor = "system"): SurveyAssignment | null {
    const a = surveyRepository.getAssignment(id);
    if (!a) return null;
    if (!["DRAFT", "ASSIGNED", "PAUSED"].includes(a.status)) return null;
    const next: SurveyAssignment = {
      ...a,
      status: "ACTIVE",
      actualStart: a.actualStart ?? Date.now(),
      updatedAt: Date.now(),
    };
    surveyRepository.saveAssignment(next);
    audit(next.tenantId, actor, "Survey Started", next.id, next.vehicleId);
    publishSurveyEvent("survey_started", next.tenantId, { assignment: next });
    publishSurveyEvent("survey_assignment_updated", next.tenantId, { assignment: next });
    return next;
  },

  pauseAssignment(id: string, actor = "system"): SurveyAssignment | null {
    const a = surveyRepository.getAssignment(id);
    if (!a || a.status !== "ACTIVE") return null;
    const next: SurveyAssignment = { ...a, status: "PAUSED", updatedAt: Date.now() };
    surveyRepository.saveAssignment(next);
    audit(next.tenantId, actor, "Survey Paused", next.id, next.vehicleId);
    publishSurveyEvent("survey_paused", next.tenantId, { assignment: next });
    publishSurveyEvent("survey_assignment_updated", next.tenantId, { assignment: next });
    return next;
  },

  resumeAssignment(id: string, actor = "system"): SurveyAssignment | null {
    const a = surveyRepository.getAssignment(id);
    if (!a || a.status !== "PAUSED") return null;
    const next: SurveyAssignment = { ...a, status: "ACTIVE", updatedAt: Date.now() };
    surveyRepository.saveAssignment(next);
    audit(next.tenantId, actor, "Survey Resumed", next.id, next.vehicleId);
    publishSurveyEvent("survey_resumed", next.tenantId, { assignment: next });
    publishSurveyEvent("survey_assignment_updated", next.tenantId, { assignment: next });
    return next;
  },

  completeAssignment(id: string, actor = "system"): SurveyAssignment | null {
    const a = surveyRepository.getAssignment(id);
    if (!a || !["ACTIVE", "PAUSED"].includes(a.status)) return null;
    const next: SurveyAssignment = {
      ...a,
      status: "COMPLETED",
      actualEnd: Date.now(),
      updatedAt: Date.now(),
    };
    surveyRepository.saveAssignment(next);
    audit(next.tenantId, actor, "Survey Completed", next.id, next.vehicleId);
    notify({
      tenantId: next.tenantId,
      vehicleId: next.vehicleId,
      assignmentId: next.id,
      type: "SURVEY_COMPLETED",
      title: "Survey Completed",
      body: `${next.routeName} completed`,
      severity: "INFO",
      payload: {},
    });
    publishSurveyEvent("survey_completed", next.tenantId, { assignment: next });
    publishSurveyEvent("survey_assignment_updated", next.tenantId, { assignment: next });
    return next;
  },

  cancelAssignment(id: string, actor = "system"): SurveyAssignment | null {
    const a = surveyRepository.getAssignment(id);
    if (!a || a.status === "COMPLETED" || a.status === "CANCELLED") return null;
    const next: SurveyAssignment = {
      ...a,
      status: "CANCELLED",
      actualEnd: Date.now(),
      updatedAt: Date.now(),
    };
    surveyRepository.saveAssignment(next);
    audit(next.tenantId, actor, "Survey Cancelled", next.id, next.vehicleId);
    publishSurveyEvent("survey_assignment_updated", next.tenantId, { assignment: next });
    return next;
  },

  getActiveForVehicle(vehicleId: string, tenantId?: string): SurveyAssignment | undefined {
    return surveyRepository
      .listAssignments(tenantId)
      .find((a) => a.vehicleId === vehicleId && ACTIVE_ASSIGNMENT_STATUSES.includes(a.status));
  },

  saveDecision(decision: SurveyDecision): void {
    surveyRepository.saveDecision(decision);
    publishSurveyEvent("survey_decision_updated", decision.tenantId, { decision });

    if (decision.wrongDirection) {
      notify({
        tenantId: decision.tenantId,
        vehicleId: decision.vehicleId,
        assignmentId: decision.assignmentId,
        type: "WRONG_DIRECTION",
        title: "Wrong Direction",
        body: `Vehicle ${decision.vehicleId} wrong direction`,
        severity: "CRITICAL",
        payload: { decisionId: decision.id },
      });
      audit(decision.tenantId, "sge", "Wrong Direction", decision.assignmentId, decision.vehicleId);
    }
    if (decision.routeState === "OFF_ROUTE") {
      notify({
        tenantId: decision.tenantId,
        vehicleId: decision.vehicleId,
        assignmentId: decision.assignmentId,
        type: "OFF_ROUTE",
        title: "Off Route",
        body: `Vehicle ${decision.vehicleId} off assigned route`,
        severity: "CRITICAL",
        payload: { distance: decision.distanceFromRoute },
      });
      audit(decision.tenantId, "sge", "Off Route", decision.assignmentId, decision.vehicleId, {
        distance: decision.distanceFromRoute,
      });
    }
    if (decision.routeState === "GPS_UNRELIABLE") {
      notify({
        tenantId: decision.tenantId,
        vehicleId: decision.vehicleId,
        assignmentId: decision.assignmentId,
        type: "GPS_LOST",
        title: "GPS Lost",
        body: `Poor GPS accuracy (${decision.gpsAccuracy}m)`,
        severity: "WARNING",
        payload: {},
      });
    }
    if (decision.previousRouteState !== "ON_ROUTE" && decision.routeState === "ON_ROUTE") {
      audit(decision.tenantId, "sge", "Return", decision.assignmentId, decision.vehicleId);
    }
  },

  listDecisions(opts: { vehicleId?: string; assignmentId?: string; limit?: number }) {
    return surveyRepository.listDecisions(opts);
  },

  saveAlert(alert: SupervisorAlert): void {
    surveyRepository.saveAlert(alert);
    publishSurveyEvent("survey_alert_created", alert.tenantId, { alert });
  },

  acknowledgeAlert(id: string, by: string): SupervisorAlert | null {
    const alerts = surveyRepository.listAlerts();
    const a = alerts.find((x) => x.id === id);
    if (!a) return null;
    const next: SupervisorAlert = {
      ...a,
      status: "ACKNOWLEDGED",
      acknowledgedBy: by,
      acknowledgedAt: Date.now(),
    };
    surveyRepository.saveAlert(next);
    publishSurveyEvent("survey_alert_acknowledged", next.tenantId, { alert: next });
    return next;
  },

  listAlerts(tenantId?: string) {
    return surveyRepository.listAlerts(tenantId);
  },

  saveBlockage(b: SurveyBlockageRecord): void {
    surveyRepository.saveBlockage(b);
    audit(b.tenantId, b.vehicleId, "Blockage", b.assignmentId, b.vehicleId, {
      reason: b.reason,
    });
    notify({
      tenantId: b.tenantId,
      vehicleId: b.vehicleId,
      assignmentId: b.assignmentId,
      type: "ROAD_BLOCKAGE",
      title: "Road Blockage",
      body: b.reason.replace(/_/g, " "),
      severity: "CRITICAL",
      payload: { blockageId: b.id },
    });
    publishSurveyEvent("blockage_reported", b.tenantId, { blockage: b });
  },

  listBlockages() {
    return surveyRepository.listBlockages();
  },

  savePhoto(p: SurveyPhotoMeta): void {
    surveyRepository.savePhoto(p);
    audit(p.tenantId, p.vehicleId, "Photo Upload", p.assignmentId, p.vehicleId, {
      photoId: p.id,
      filename: p.filename,
    });
    publishSurveyEvent("survey_photo_uploaded", p.tenantId, { photo: p });
  },

  getPhoto(id: string) {
    return surveyRepository.getPhoto(id);
  },

  deletePhoto(id: string) {
    surveyRepository.deletePhoto(id);
  },

  listNotifications(tenantId?: string) {
    return surveyRepository.listNotifications(tenantId);
  },

  markNotificationRead(id: string): SurveyNotification | null {
    const n = surveyRepository.listNotifications().find((x) => x.id === id);
    if (!n) return null;
    const next = { ...n, read: true };
    surveyRepository.saveNotification(next);
    return next;
  },

  listAudit(assignmentId?: string) {
    return surveyRepository.listAudit(assignmentId);
  },

  saveProgress(p: SurveyProgressRecord) {
    surveyRepository.saveProgress(p);
  },

  listProgress() {
    return surveyRepository.listProgress();
  },

  issueCommand(
    type: SupervisorCommandType,
    opts: {
      tenantId: string;
      assignmentId: string;
      vehicleId: string;
      issuedBy: string;
      message?: string;
    }
  ): SupervisorCommand {
    const cmd: SupervisorCommand = {
      id: `cmd-${uuidv4()}`,
      type,
      tenantId: opts.tenantId,
      assignmentId: opts.assignmentId,
      vehicleId: opts.vehicleId,
      message: opts.message,
      issuedBy: opts.issuedBy,
      timestamp: Date.now(),
    };

    audit(opts.tenantId, opts.issuedBy, `Supervisor Command: ${type}`, opts.assignmentId, opts.vehicleId, {
      message: opts.message,
    });

    switch (type) {
      case "PAUSE":
        this.pauseAssignment(opts.assignmentId, opts.issuedBy);
        break;
      case "RESUME":
        this.resumeAssignment(opts.assignmentId, opts.issuedBy);
        break;
      case "CANCEL":
        this.cancelAssignment(opts.assignmentId, opts.issuedBy);
        break;
      case "SEND_MESSAGE":
      case "REQUEST_RETURN":
      case "APPROVE_DIVERSION":
      case "REJECT_DIVERSION":
        notify({
          tenantId: opts.tenantId,
          vehicleId: opts.vehicleId,
          assignmentId: opts.assignmentId,
          type: `CMD_${type}`,
          title: type.replace(/_/g, " "),
          body: opts.message ?? type,
          severity: type === "REJECT_DIVERSION" ? "WARNING" : "INFO",
          payload: { commandId: cmd.id },
        });
        break;
    }

    publishSurveyEvent(
      type === "SEND_MESSAGE" ? "driver_message" : "supervisor_command",
      opts.tenantId,
      { command: cmd }
    );

    return cmd;
  },

  recordEmergency(tenantId: string, assignmentId: string, vehicleId: string): void {
    notify({
      tenantId,
      vehicleId,
      assignmentId,
      type: "EMERGENCY",
      title: "Emergency",
      body: `Emergency from vehicle ${vehicleId}`,
      severity: "CRITICAL",
      payload: {},
    });
    audit(tenantId, vehicleId, "Emergency", assignmentId, vehicleId);
  },
};
