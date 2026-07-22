/**
 * Route Assignment Store — reactive façade over production survey API + local SGE cache.
 * Persistence is server-side; Assignment Manager mirrors for SGE session context.
 */

"use client";

import { create } from "zustand";
import type { SurveyAssignment, CreateAssignmentInput } from "@/platform/sge";
import { assignmentManager } from "@/platform/sge";
import { useSgeStore } from "@/store/sge-store";
import { surveyApi } from "@/services/survey/client-api";
import { offlineQueue } from "@/platform/sge";

interface RouteAssignmentState {
  assignments: SurveyAssignment[];
  activeAssignment: SurveyAssignment | null;
  syncStatus: "idle" | "syncing" | "error" | "offline";
  lastError: string | null;

  refresh: () => Promise<void>;
  createAndStart: (input: CreateAssignmentInput) => Promise<SurveyAssignment>;
  cancelAssignment: (assignmentId: string) => Promise<void>;
  completeAssignment: (assignmentId: string) => Promise<void>;
  pauseAssignment: (assignmentId: string) => Promise<void>;
  resumeAssignment: (assignmentId: string) => Promise<void>;
  getAssignmentForVehicle: (vehicleId: string) => SurveyAssignment | undefined;
  applyRemoteAssignment: (assignment: SurveyAssignment) => void;
}

function restoreActiveSurveySessions(assignments: SurveyAssignment[]): void {
  const sge = useSgeStore.getState();
  for (const a of assignments) {
    if (a.status !== "ACTIVE" && a.status !== "PAUSED") continue;
    if (!sge.byVehicle[a.vehicleId]) {
      sge.startFromAssignment(a);
    }
    if (a.status === "PAUSED") {
      sge.pause(a.vehicleId);
    }
  }
}

function pickActive(assignments: SurveyAssignment[]): SurveyAssignment | null {
  return (
    assignments.find((a) => a.status === "ACTIVE" || a.status === "PAUSED") ??
    assignments.find((a) => a.status === "ASSIGNED") ??
    null
  );
}

export const useRouteAssignmentStore = create<RouteAssignmentState>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  syncStatus: "idle",
  lastError: null,

  refresh: async () => {
    set({ syncStatus: "syncing" });
    try {
      const assignments = await surveyApi.listAssignments();
      assignmentManager.hydrateFromServer(assignments);
      restoreActiveSurveySessions(assignments);
      set({
        assignments,
        activeAssignment: pickActive(assignments),
        syncStatus: "idle",
        lastError: null,
      });
    } catch (err) {
      const local = assignmentManager.getAll();
      restoreActiveSurveySessions(local);
      set({
        assignments: local,
        activeAssignment: pickActive(local),
        syncStatus: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
        lastError: err instanceof Error ? err.message : "refresh failed",
      });
    }
  },

  createAndStart: async (input) => {
    try {
      const assignment = await surveyApi.createAssignment({ ...input, autoStart: true });
      assignmentManager.upsertFromServer(assignment);
      useSgeStore.getState().startFromAssignment(assignment);
      await get().refresh();
      return assignment;
    } catch (err) {
      offlineQueue.enqueue({
        type: "ASSIGNMENT_UPDATE",
        tenantId: input.tenantId,
        vehicleId: input.vehicleId,
        assignmentId: null,
        payload: { op: "createAndStart", input },
      });
      // Local fallback so field ops continue offline
      const draft = assignmentManager.create(input);
      const assigned = assignmentManager.assignVehicle(draft.id, input.vehicleId);
      const started = assignmentManager.startSurvey(assigned?.id ?? draft.id);
      const final = started ?? assigned ?? draft;
      useSgeStore.getState().startFromAssignment(final);
      get().refresh();
      void err;
      return final;
    }
  },

  cancelAssignment: async (assignmentId) => {
    const a = assignmentManager.getById(assignmentId);
    try {
      await surveyApi.cancel(assignmentId, "supervisor");
    } catch {
      offlineQueue.enqueue({
        type: "ASSIGNMENT_UPDATE",
        tenantId: a?.tenantId ?? "dubai-giscd",
        vehicleId: a?.vehicleId ?? "",
        assignmentId,
        payload: { op: "cancel" },
      });
      assignmentManager.cancelSurvey(assignmentId);
    }
    if (a) useSgeStore.getState().endSession(a.vehicleId);
    await get().refresh();
  },

  completeAssignment: async (assignmentId) => {
    try {
      await surveyApi.complete(assignmentId);
    } catch {
      offlineQueue.enqueue({
        type: "ASSIGNMENT_UPDATE",
        tenantId: "dubai-giscd",
        vehicleId: "",
        assignmentId,
        payload: { op: "complete" },
      });
      assignmentManager.completeSurvey(assignmentId);
    }
    await get().refresh();
  },

  pauseAssignment: async (assignmentId) => {
    try {
      const a = await surveyApi.pause(assignmentId);
      assignmentManager.upsertFromServer(a);
      useSgeStore.getState().pause(a.vehicleId);
    } catch {
      const a = assignmentManager.pauseSurvey(assignmentId);
      if (a) useSgeStore.getState().pause(a.vehicleId);
      offlineQueue.enqueue({
        type: "ASSIGNMENT_UPDATE",
        tenantId: a?.tenantId ?? "dubai-giscd",
        vehicleId: a?.vehicleId ?? "",
        assignmentId,
        payload: { op: "pause" },
      });
    }
    await get().refresh();
  },

  resumeAssignment: async (assignmentId) => {
    try {
      const a = await surveyApi.resume(assignmentId);
      assignmentManager.upsertFromServer(a);
      useSgeStore.getState().resume(a.vehicleId);
    } catch {
      const a = assignmentManager.resumeSurvey(assignmentId);
      if (a) useSgeStore.getState().resume(a.vehicleId);
      offlineQueue.enqueue({
        type: "ASSIGNMENT_UPDATE",
        tenantId: a?.tenantId ?? "dubai-giscd",
        vehicleId: a?.vehicleId ?? "",
        assignmentId,
        payload: { op: "resume" },
      });
    }
    await get().refresh();
  },

  getAssignmentForVehicle: (vehicleId) =>
    assignmentManager.getActiveForVehicle(vehicleId),

  applyRemoteAssignment: (assignment) => {
    assignmentManager.upsertFromServer(assignment);
    const assignments = assignmentManager.getAll();
    set({ assignments, activeAssignment: pickActive(assignments) });
  },
}));
