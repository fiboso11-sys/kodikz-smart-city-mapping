/**
 * Supervisor Alert Center — production alert lifecycle.
 */

import type {
  AlertCategory,
  AlertFilters,
  AlertSeverity,
  SupervisorAlert,
} from "../types/alert";
import { loadJson, saveJson, SGE_STORAGE_KEYS } from "../persistence/storage";
import { sgeEventBus } from "../event-bus/event-bus";
import type { SgePlatformEvent } from "../types/events";

let alertSeq = 0;

function nextAlertId(): string {
  alertSeq += 1;
  return `alt-${Date.now()}-${alertSeq}`;
}

function eventToCategory(type: string): AlertCategory {
  switch (type) {
    case "OFF_ROUTE":
    case "WARNING":
    case "RETURNING":
      return "ROUTE_DEVIATION";
    case "WRONG_DIRECTION":
      return "WRONG_DIRECTION";
    case "GPS_UNRELIABLE":
      return "GPS_QUALITY";
    case "BLOCKAGE_REPORTED":
      return "BLOCKAGE";
    case "SURVEY_COMPLETED":
      return "COMPLETION";
    default:
      return "SYSTEM";
  }
}

export type AlertListener = (alerts: SupervisorAlert[]) => void;

export class AlertCenter {
  private alerts = new Map<string, SupervisorAlert>();
  private listeners = new Set<AlertListener>();
  private unsub: (() => void) | null = null;

  constructor() {
    this.restore();
    this.unsub = sgeEventBus.subscribe("*", (event) => this.onPlatformEvent(event));
  }

  private onPlatformEvent(event: SgePlatformEvent): void {
    const actionable = new Set([
      "WARNING",
      "OFF_ROUTE",
      "WRONG_DIRECTION",
      "GPS_UNRELIABLE",
      "BLOCKAGE_REPORTED",
      "SURVEY_COMPLETED",
    ]);
    if (!actionable.has(event.type)) return;

    this.create({
      tenantId: event.tenantId,
      assignmentId: event.assignmentId,
      vehicleId: event.vehicleId,
      severity: event.severity as AlertSeverity,
      category: eventToCategory(event.type),
      message: `${event.type.replace(/_/g, " ")} — vehicle ${event.vehicleId}`,
      payload: event.payload,
      timestamp: event.timestamp,
    });
  }

  create(input: {
    tenantId: string;
    assignmentId: string;
    vehicleId: string;
    severity: AlertSeverity;
    category: AlertCategory;
    message: string;
    payload?: Record<string, unknown>;
    timestamp?: number;
  }): SupervisorAlert {
    const alert: SupervisorAlert = {
      id: nextAlertId(),
      tenantId: input.tenantId,
      assignmentId: input.assignmentId,
      vehicleId: input.vehicleId,
      severity: input.severity,
      category: input.category,
      message: input.message,
      timestamp: input.timestamp ?? Date.now(),
      status: "OPEN",
      acknowledgedBy: null,
      acknowledgedAt: null,
      payload: input.payload ?? {},
    };
    this.alerts.set(alert.id, alert);
    this.persist();
    this.notify();
    return alert;
  }

  acknowledge(alertId: string, by: string): SupervisorAlert | null {
    const a = this.alerts.get(alertId);
    if (!a || a.status !== "OPEN") return null;
    const next: SupervisorAlert = {
      ...a,
      status: "ACKNOWLEDGED",
      acknowledgedBy: by,
      acknowledgedAt: Date.now(),
    };
    this.alerts.set(alertId, next);
    this.persist();
    this.notify();
    return next;
  }

  dismiss(alertId: string, by: string): SupervisorAlert | null {
    const a = this.alerts.get(alertId);
    if (!a) return null;
    const next: SupervisorAlert = {
      ...a,
      status: "DISMISSED",
      acknowledgedBy: by,
      acknowledgedAt: Date.now(),
    };
    this.alerts.set(alertId, next);
    this.persist();
    this.notify();
    return next;
  }

  filter(filters: AlertFilters = {}, tenantId?: string): SupervisorAlert[] {
    return this.getAll(tenantId).filter((a) => {
      if (filters.vehicleId && a.vehicleId !== filters.vehicleId) return false;
      if (filters.severity && a.severity !== filters.severity) return false;
      if (filters.assignmentId && a.assignmentId !== filters.assignmentId) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.category && a.category !== filters.category) return false;
      return true;
    });
  }

  getAll(tenantId?: string): SupervisorAlert[] {
    const all = Array.from(this.alerts.values()).sort((a, b) => b.timestamp - a.timestamp);
    return tenantId ? all.filter((a) => a.tenantId === tenantId) : all;
  }

  exportCsv(filters: AlertFilters = {}, tenantId?: string): string {
    const rows = this.filter(filters, tenantId);
    const header =
      "id,vehicleId,assignmentId,severity,category,status,timestamp,message,acknowledgedBy";
    const body = rows.map((a) =>
      [
        a.id,
        a.vehicleId,
        a.assignmentId,
        a.severity,
        a.category,
        a.status,
        new Date(a.timestamp).toISOString(),
        JSON.stringify(a.message),
        a.acknowledgedBy ?? "",
      ].join(",")
    );
    return [header, ...body].join("\n");
  }

  subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.unsub?.();
    this.unsub = null;
  }

  private notify(): void {
    const snap = this.getAll();
    this.listeners.forEach((l) => {
      try {
        l(snap);
      } catch {
        /* isolate */
      }
    });
  }

  private persist(): void {
    saveJson(SGE_STORAGE_KEYS.alerts, this.getAll().slice(0, 500));
  }

  private restore(): void {
    const stored = loadJson<SupervisorAlert[]>(SGE_STORAGE_KEYS.alerts, []);
    for (const a of stored) {
      if (a?.id) this.alerts.set(a.id, a);
    }
  }
}

export const alertCenter = new AlertCenter();
