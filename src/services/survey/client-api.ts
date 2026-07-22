/**
 * Client API — UI must not touch persistence directly.
 */

import type {
  CreateAssignmentInput,
  SurveyAssignment,
} from "@/platform/sge";
import type {
  SurveyBlockageRecord,
  SurveyDecision,
  SurveyNotification,
  SurveyPhotoMeta,
  SurveyProgressRecord,
  SurveySocketEvent,
  SupervisorAlert,
  SupervisorCommand,
  SupervisorCommandType,
} from "@/services/survey/types";

async function authHeaders(extra: HeadersInit = {}): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    ...(extra as Record<string, string>),
  };
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("kodikz_access");
    if (token) headers.Authorization = `Bearer ${token}`;
    else headers["x-mock-role"] = window.localStorage.getItem("kodikz_mock_role") || "SUPERVISOR";
  } else {
    headers["x-mock-role"] = "SUPERVISOR";
  }
  return headers;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      code?: string;
    };
    throw new Error(err.message ?? err.error ?? err.code ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const surveyApi = {
  async listAssignments(tenantId = "dubai-giscd"): Promise<SurveyAssignment[]> {
    const data = await parseJson<{ assignments: SurveyAssignment[] }>(
      await fetch(`/api/survey-assignments?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: await authHeaders(),
      })
    );
    return data.assignments;
  },

  async createAssignment(
    input: CreateAssignmentInput & { autoStart?: boolean }
  ): Promise<SurveyAssignment> {
    const data = await parseJson<{ assignment: SurveyAssignment }>(
      await fetch("/api/survey-assignments", {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(input),
      })
    );
    return data.assignment;
  },

  async start(id: string, actor = "driver"): Promise<SurveyAssignment> {
    const data = await parseJson<{ assignment: SurveyAssignment }>(
      await fetch(`/api/survey-assignments/${id}/start`, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ actor }),
      })
    );
    return data.assignment;
  },

  async pause(id: string, actor = "driver"): Promise<SurveyAssignment> {
    const data = await parseJson<{ assignment: SurveyAssignment }>(
      await fetch(`/api/survey-assignments/${id}/pause`, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ actor }),
      })
    );
    return data.assignment;
  },

  async resume(id: string, actor = "driver"): Promise<SurveyAssignment> {
    const data = await parseJson<{ assignment: SurveyAssignment }>(
      await fetch(`/api/survey-assignments/${id}/resume`, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ actor }),
      })
    );
    return data.assignment;
  },

  async complete(id: string, actor = "driver"): Promise<SurveyAssignment> {
    const data = await parseJson<{ assignment: SurveyAssignment }>(
      await fetch(`/api/survey-assignments/${id}/complete`, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ actor }),
      })
    );
    return data.assignment;
  },

  async cancel(id: string, actor = "supervisor"): Promise<SurveyAssignment> {
    const data = await parseJson<{ assignment: SurveyAssignment }>(
      await fetch(`/api/survey-assignments/${id}/cancel`, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ actor }),
      })
    );
    return data.assignment;
  },

  async postDecision(decision: SurveyDecision): Promise<void> {
    await parseJson(await fetch("/api/survey-decisions", {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(decision),
    }));
  },

  async postBlockage(blockage: SurveyBlockageRecord): Promise<void> {
    await parseJson(await fetch("/api/blockages", {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(blockage),
    }));
  },

  async postProgress(progress: SurveyProgressRecord): Promise<void> {
    await parseJson(await fetch("/api/survey-progress", {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(progress),
    }));
  },

  async postAlert(alert: SupervisorAlert): Promise<void> {
    await parseJson(await fetch("/api/survey-alerts", {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(alert),
    }));
  },

  async acknowledgeAlert(id: string, by: string): Promise<SupervisorAlert> {
    const data = await parseJson<{ alert: SupervisorAlert }>(
      await fetch("/api/survey-alerts", {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "acknowledge", id, by }),
      })
    );
    return data.alert;
  },

  async issueCommand(opts: {
    type: SupervisorCommandType;
    tenantId: string;
    assignmentId: string;
    vehicleId: string;
    issuedBy?: string;
    message?: string;
  }): Promise<SupervisorCommand> {
    const data = await parseJson<{ command: SupervisorCommand }>(
      await fetch("/api/survey-commands", {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(opts),
      })
    );
    return data.command;
  },

  async listNotifications(tenantId = "dubai-giscd"): Promise<SurveyNotification[]> {
    const data = await parseJson<{ notifications: SurveyNotification[] }>(
      await fetch(`/api/survey-notifications?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: await authHeaders(),
      })
    );
    return data.notifications;
  },

  async markNotificationRead(id: string): Promise<void> {
    await parseJson(
      await fetch("/api/survey-notifications", {
        method: "PATCH",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id, action: "read" }),
      })
    );
  },

  async uploadPhoto(opts: {
    file: Blob;
    filename: string;
    tenantId: string;
    assignmentId: string;
    vehicleId: string;
    blockageId?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<SurveyPhotoMeta> {
    const form = new FormData();
    form.append("file", opts.file, opts.filename);
    form.append("tenantId", opts.tenantId);
    form.append("assignmentId", opts.assignmentId);
    form.append("vehicleId", opts.vehicleId);
    if (opts.blockageId) form.append("blockageId", opts.blockageId);
    if (opts.latitude != null) form.append("latitude", String(opts.latitude));
    if (opts.longitude != null) form.append("longitude", String(opts.longitude));
    const data = await parseJson<{ photo: SurveyPhotoMeta }>(
      await fetch("/api/attachments", {
        method: "POST",
        headers: await authHeaders(),
        body: form,
      })
    );
    return data.photo;
  },

  async deletePhoto(id: string): Promise<void> {
    await parseJson(
      await fetch(`/api/attachments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: await authHeaders(),
      })
    );
  },

  async getTimeline(assignmentId?: string) {
    const q = assignmentId ? `?assignmentId=${encodeURIComponent(assignmentId)}` : "";
    return parseJson<{ timeline: Array<Record<string, unknown>>; count: number }>(
      await fetch(`/api/survey-timeline${q}`, { headers: await authHeaders() })
    );
  },
};

export type { SurveySocketEvent };
