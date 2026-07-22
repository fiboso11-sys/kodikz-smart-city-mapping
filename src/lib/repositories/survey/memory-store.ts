/**
 * In-memory survey store — fallback when SQLite unavailable (e.g. Vercel edge).
 */

import type {
  SurveyAssignment,
  SurveyAuditEntry,
  SurveyBlockageRecord,
  SurveyDecision,
  SurveyNotification,
  SurveyPhotoMeta,
  SurveyProgressRecord,
  SupervisorAlert,
} from "@/services/survey/types";

const g = globalThis as unknown as {
  __kodikzSurveyMem?: {
    assignments: Map<string, SurveyAssignment>;
    decisions: SurveyDecision[];
    alerts: Map<string, SupervisorAlert>;
    blockages: Map<string, SurveyBlockageRecord>;
    photos: Map<string, SurveyPhotoMeta>;
    notifications: Map<string, SurveyNotification>;
    audit: SurveyAuditEntry[];
    progress: Map<string, SurveyProgressRecord>;
  };
};

function mem() {
  if (!g.__kodikzSurveyMem) {
    g.__kodikzSurveyMem = {
      assignments: new Map(),
      decisions: [],
      alerts: new Map(),
      blockages: new Map(),
      photos: new Map(),
      notifications: new Map(),
      audit: [],
      progress: new Map(),
    };
  }
  return g.__kodikzSurveyMem;
}

export const memorySurveyStore = {
  assignments: {
    all: () => Array.from(mem().assignments.values()),
    get: (id: string) => mem().assignments.get(id),
    set: (a: SurveyAssignment) => mem().assignments.set(a.id, a),
    byVehicle: (vehicleId: string) =>
      Array.from(mem().assignments.values()).filter((a) => a.vehicleId === vehicleId),
  },
  decisions: {
    push: (d: SurveyDecision) => {
      mem().decisions.push(d);
      if (mem().decisions.length > 5000) mem().decisions = mem().decisions.slice(-5000);
    },
    byVehicle: (vehicleId: string, limit = 50) =>
      mem().decisions.filter((d) => d.vehicleId === vehicleId).slice(-limit),
    byAssignment: (assignmentId: string, limit = 50) =>
      mem().decisions.filter((d) => d.assignmentId === assignmentId).slice(-limit),
  },
  alerts: {
    all: () => Array.from(mem().alerts.values()),
    get: (id: string) => mem().alerts.get(id),
    set: (a: SupervisorAlert) => mem().alerts.set(a.id, a),
  },
  blockages: {
    all: () => Array.from(mem().blockages.values()),
    set: (b: SurveyBlockageRecord) => mem().blockages.set(b.id, b),
  },
  photos: {
    all: () => Array.from(mem().photos.values()),
    get: (id: string) => mem().photos.get(id),
    set: (p: SurveyPhotoMeta) => mem().photos.set(p.id, p),
    delete: (id: string) => mem().photos.delete(id),
  },
  notifications: {
    all: () => Array.from(mem().notifications.values()),
    get: (id: string) => mem().notifications.get(id),
    set: (n: SurveyNotification) => mem().notifications.set(n.id, n),
  },
  audit: {
    all: () => [...mem().audit],
    push: (e: SurveyAuditEntry) => {
      mem().audit.push(e);
      if (mem().audit.length > 10000) mem().audit = mem().audit.slice(-10000);
    },
    byAssignment: (assignmentId: string) =>
      mem().audit.filter((e) => e.assignmentId === assignmentId),
  },
  progress: {
    get: (assignmentId: string) => mem().progress.get(assignmentId),
    set: (p: SurveyProgressRecord) => mem().progress.set(p.assignmentId, p),
    all: () => Array.from(mem().progress.values()),
  },
};
