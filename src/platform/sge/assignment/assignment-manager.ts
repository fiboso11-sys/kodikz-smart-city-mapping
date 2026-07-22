/**
 * Survey Assignment Manager — production lifecycle for survey assignments.
 * Survives refresh / reconnect. Sole provider of active survey context.
 */

import type {
  AssignmentStatus,
  CreateAssignmentInput,
  SurveyAssignment,
} from "../types/assignment";
import { ACTIVE_ASSIGNMENT_STATUSES } from "../types/assignment";
import { loadJson, saveJson, SGE_STORAGE_KEYS } from "../persistence/storage";
import { sgeEventBus } from "../event-bus/event-bus";

let assignSeq = 0;

function nextAssignmentId(): string {
  assignSeq += 1;
  return `asg-${Date.now()}-${assignSeq}`;
}

function touch(a: SurveyAssignment, patch: Partial<SurveyAssignment>): SurveyAssignment {
  return { ...a, ...patch, updatedAt: Date.now() };
}

export type AssignmentListener = (assignments: SurveyAssignment[]) => void;

export class AssignmentManager {
  private assignments = new Map<string, SurveyAssignment>();
  private listeners = new Set<AssignmentListener>();

  constructor() {
    this.restore();
  }

  create(input: CreateAssignmentInput): SurveyAssignment {
    const now = Date.now();
    const assignment: SurveyAssignment = {
      id: nextAssignmentId(),
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

    this.assignments.set(assignment.id, assignment);
    this.persist();
    this.notify();

    sgeEventBus.publish({
      type: "ASSIGNMENT_CREATED",
      timestamp: now,
      tenantId: assignment.tenantId,
      vehicleId: assignment.vehicleId,
      assignmentId: assignment.id,
      severity: "INFO",
      payload: { routeId: assignment.routeId, routeName: assignment.routeName },
    });

    return assignment;
  }

  assignVehicle(assignmentId: string, vehicleId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a || a.status === "COMPLETED" || a.status === "CANCELLED") return null;
    const next = touch(a, {
      vehicleId,
      status: a.status === "DRAFT" ? "ASSIGNED" : a.status,
    });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();
    return next;
  }

  assignDriver(assignmentId: string, driverId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a || a.status === "COMPLETED" || a.status === "CANCELLED") return null;
    const next = touch(a, {
      driverId,
      status: a.status === "DRAFT" ? "ASSIGNED" : a.status,
    });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();
    return next;
  }

  startSurvey(assignmentId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a) return null;
    if (a.status !== "DRAFT" && a.status !== "ASSIGNED" && a.status !== "PAUSED") {
      return null;
    }
    const next = touch(a, {
      status: "ACTIVE",
      actualStart: a.actualStart ?? Date.now(),
    });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();

    sgeEventBus.publish({
      type: "SURVEY_STARTED",
      timestamp: Date.now(),
      tenantId: next.tenantId,
      vehicleId: next.vehicleId,
      assignmentId: next.id,
      severity: "INFO",
      payload: { routeName: next.routeName },
    });

    return next;
  }

  pauseSurvey(assignmentId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a || a.status !== "ACTIVE") return null;
    const next = touch(a, { status: "PAUSED" });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();

    sgeEventBus.publish({
      type: "SURVEY_PAUSED",
      timestamp: Date.now(),
      tenantId: next.tenantId,
      vehicleId: next.vehicleId,
      assignmentId: next.id,
      severity: "INFO",
      payload: {},
    });

    return next;
  }

  resumeSurvey(assignmentId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a || a.status !== "PAUSED") return null;
    const next = touch(a, { status: "ACTIVE" });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();

    sgeEventBus.publish({
      type: "SURVEY_RESUMED",
      timestamp: Date.now(),
      tenantId: next.tenantId,
      vehicleId: next.vehicleId,
      assignmentId: next.id,
      severity: "INFO",
      payload: {},
    });

    return next;
  }

  completeSurvey(assignmentId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a || (a.status !== "ACTIVE" && a.status !== "PAUSED")) return null;
    const next = touch(a, { status: "COMPLETED", actualEnd: Date.now() });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();

    sgeEventBus.publish({
      type: "SURVEY_COMPLETED",
      timestamp: Date.now(),
      tenantId: next.tenantId,
      vehicleId: next.vehicleId,
      assignmentId: next.id,
      severity: "INFO",
      payload: {},
    });

    return next;
  }

  cancelSurvey(assignmentId: string): SurveyAssignment | null {
    const a = this.assignments.get(assignmentId);
    if (!a || a.status === "COMPLETED" || a.status === "CANCELLED") return null;
    const next = touch(a, { status: "CANCELLED", actualEnd: Date.now() });
    this.assignments.set(assignmentId, next);
    this.persist();
    this.notify();

    sgeEventBus.publish({
      type: "SURVEY_CANCELLED",
      timestamp: Date.now(),
      tenantId: next.tenantId,
      vehicleId: next.vehicleId,
      assignmentId: next.id,
      severity: "WARNING",
      payload: {},
    });

    return next;
  }

  getById(id: string): SurveyAssignment | undefined {
    return this.assignments.get(id);
  }

  getAll(tenantId?: string): SurveyAssignment[] {
    const all = Array.from(this.assignments.values());
    return tenantId ? all.filter((a) => a.tenantId === tenantId) : all;
  }

  getActiveForVehicle(vehicleId: string, tenantId?: string): SurveyAssignment | undefined {
    return this.getAll(tenantId).find(
      (a) =>
        a.vehicleId === vehicleId && ACTIVE_ASSIGNMENT_STATUSES.includes(a.status)
    );
  }

  getActiveAssignments(tenantId?: string): SurveyAssignment[] {
    return this.getAll(tenantId).filter((a) =>
      ACTIVE_ASSIGNMENT_STATUSES.includes(a.status)
    );
  }

  /** Upsert from production API / SSE — keeps local SGE cache aligned with server. */
  upsertFromServer(assignment: SurveyAssignment): void {
    if (!assignment?.id || !assignment.geometry) return;
    this.assignments.set(assignment.id, assignment);
    this.persist();
    this.notify();
  }

  /** Replace local cache with server list (tenant sync / reconnect). */
  hydrateFromServer(assignments: SurveyAssignment[]): void {
    this.assignments.clear();
    for (const a of assignments) {
      if (a?.id && a.vehicleId && a.geometry) {
        this.assignments.set(a.id, a);
      }
    }
    this.persist();
    this.notify();
  }

  /** Restore after refresh — re-emits ASSIGNMENT_RESTORED for active ones */
  restoreActiveAssignments(): SurveyAssignment[] {
    const active = this.getActiveAssignments();
    for (const a of active) {
      sgeEventBus.publish({
        type: "ASSIGNMENT_RESTORED",
        timestamp: Date.now(),
        tenantId: a.tenantId,
        vehicleId: a.vehicleId,
        assignmentId: a.id,
        severity: "INFO",
        payload: { status: a.status, routeName: a.routeName },
      });
    }
    return active;
  }

  subscribe(listener: AssignmentListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getAll();
    this.listeners.forEach((l) => {
      try {
        l(snapshot);
      } catch {
        /* isolate */
      }
    });
  }

  private persist(): void {
    saveJson(SGE_STORAGE_KEYS.assignments, this.getAll());
  }

  private restore(): void {
    const stored = loadJson<SurveyAssignment[]>(SGE_STORAGE_KEYS.assignments, []);
    for (const a of stored) {
      if (a?.id && a.vehicleId && a.geometry) {
        this.assignments.set(a.id, a);
      }
    }
  }
}

export const assignmentManager = new AssignmentManager();
