/**
 * SQLite survey repository.
 */

import { getDb, isDatabaseReady } from "@/lib/db/sqlite";
import { memorySurveyStore } from "./memory-store";
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

function rowToAssignment(row: Record<string, unknown>): SurveyAssignment {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    vehicleId: String(row.vehicle_id),
    driverId: row.driver_id != null ? String(row.driver_id) : null,
    routeId: String(row.route_id),
    routeName: String(row.route_name),
    permitId: row.permit_id != null ? String(row.permit_id) : null,
    surveyType: row.survey_type as SurveyAssignment["surveyType"],
    priority: row.priority as SurveyAssignment["priority"],
    plannedStart: row.planned_start != null ? Number(row.planned_start) : null,
    plannedEnd: row.planned_end != null ? Number(row.planned_end) : null,
    actualStart: row.actual_start != null ? Number(row.actual_start) : null,
    actualEnd: row.actual_end != null ? Number(row.actual_end) : null,
    status: row.status as SurveyAssignment["status"],
    createdBy: String(row.created_by),
    approvedBy: row.approved_by != null ? String(row.approved_by) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    geometry: JSON.parse(String(row.geometry_json)),
  };
}

export class SurveyRepository {
  private useSqlite(): boolean {
    return isDatabaseReady();
  }

  // --- Assignments ---
  listAssignments(tenantId?: string): SurveyAssignment[] {
    if (!this.useSqlite()) {
      const all = memorySurveyStore.assignments.all();
      return tenantId ? all.filter((a) => a.tenantId === tenantId) : all;
    }
    const db = getDb();
    const rows = tenantId
      ? db.prepare("SELECT * FROM survey_assignments WHERE tenant_id = ? ORDER BY updated_at DESC").all(tenantId)
      : db.prepare("SELECT * FROM survey_assignments ORDER BY updated_at DESC").all();
    return rows.map((r) => rowToAssignment(r as Record<string, unknown>));
  }

  getAssignment(id: string): SurveyAssignment | null {
    if (!this.useSqlite()) return memorySurveyStore.assignments.get(id) ?? null;
    const row = getDb().prepare("SELECT * FROM survey_assignments WHERE id = ?").get(id);
    return row ? rowToAssignment(row as Record<string, unknown>) : null;
  }

  saveAssignment(a: SurveyAssignment): void {
    if (!this.useSqlite()) {
      memorySurveyStore.assignments.set(a);
      return;
    }
    getDb()
      .prepare(
        `INSERT INTO survey_assignments (
          id, tenant_id, vehicle_id, driver_id, route_id, route_name, permit_id,
          survey_type, priority, planned_start, planned_end, actual_start, actual_end,
          status, created_by, approved_by, created_at, updated_at, geometry_json
        ) VALUES (
          @id, @tenantId, @vehicleId, @driverId, @routeId, @routeName, @permitId,
          @surveyType, @priority, @plannedStart, @plannedEnd, @actualStart, @actualEnd,
          @status, @createdBy, @approvedBy, @createdAt, @updatedAt, @geometryJson
        )
        ON CONFLICT(id) DO UPDATE SET
          vehicle_id=excluded.vehicle_id, driver_id=excluded.driver_id,
          status=excluded.status, actual_start=excluded.actual_start,
          actual_end=excluded.actual_end, approved_by=excluded.approved_by,
          updated_at=excluded.updated_at, geometry_json=excluded.geometry_json`
      )
      .run({
        id: a.id,
        tenantId: a.tenantId,
        vehicleId: a.vehicleId,
        driverId: a.driverId,
        routeId: a.routeId,
        routeName: a.routeName,
        permitId: a.permitId,
        surveyType: a.surveyType,
        priority: a.priority,
        plannedStart: a.plannedStart,
        plannedEnd: a.plannedEnd,
        actualStart: a.actualStart,
        actualEnd: a.actualEnd,
        status: a.status,
        createdBy: a.createdBy,
        approvedBy: a.approvedBy,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        geometryJson: JSON.stringify(a.geometry),
      });
  }

  // --- Decisions ---
  saveDecision(d: SurveyDecision): void {
    if (!this.useSqlite()) {
      memorySurveyStore.decisions.push(d);
      return;
    }
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO survey_decisions (id, tenant_id, assignment_id, vehicle_id, timestamp, payload_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(d.id, d.tenantId, d.assignmentId, d.vehicleId, d.timestamp, JSON.stringify(d));
  }

  listDecisions(opts: { vehicleId?: string; assignmentId?: string; limit?: number }): SurveyDecision[] {
    const limit = opts.limit ?? 50;
    if (!this.useSqlite()) {
      if (opts.vehicleId) return memorySurveyStore.decisions.byVehicle(opts.vehicleId, limit);
      if (opts.assignmentId) return memorySurveyStore.decisions.byAssignment(opts.assignmentId, limit);
      return [];
    }
    const db = getDb();
    let rows: unknown[];
    if (opts.vehicleId) {
      rows = db
        .prepare("SELECT payload_json FROM survey_decisions WHERE vehicle_id = ? ORDER BY timestamp DESC LIMIT ?")
        .all(opts.vehicleId, limit);
    } else if (opts.assignmentId) {
      rows = db
        .prepare("SELECT payload_json FROM survey_decisions WHERE assignment_id = ? ORDER BY timestamp DESC LIMIT ?")
        .all(opts.assignmentId, limit);
    } else {
      rows = db
        .prepare("SELECT payload_json FROM survey_decisions ORDER BY timestamp DESC LIMIT ?")
        .all(limit);
    }
    return rows.map((r) => JSON.parse(String((r as { payload_json: string }).payload_json)) as SurveyDecision);
  }

  // --- Alerts ---
  saveAlert(a: SupervisorAlert): void {
    if (!this.useSqlite()) {
      memorySurveyStore.alerts.set(a);
      return;
    }
    getDb()
      .prepare(
        `INSERT INTO survey_alerts (
          id, tenant_id, assignment_id, vehicle_id, severity, category, message,
          timestamp, status, acknowledged_by, acknowledged_at, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status=excluded.status, acknowledged_by=excluded.acknowledged_by,
          acknowledged_at=excluded.acknowledged_at`
      )
      .run(
        a.id,
        a.tenantId,
        a.assignmentId,
        a.vehicleId,
        a.severity,
        a.category,
        a.message,
        a.timestamp,
        a.status,
        a.acknowledgedBy,
        a.acknowledgedAt,
        JSON.stringify(a.payload)
      );
  }

  listAlerts(tenantId?: string): SupervisorAlert[] {
    if (!this.useSqlite()) {
      const all = memorySurveyStore.alerts.all();
      return tenantId ? all.filter((a) => a.tenantId === tenantId) : all;
    }
    const rows = tenantId
      ? getDb().prepare("SELECT * FROM survey_alerts WHERE tenant_id = ? ORDER BY timestamp DESC").all(tenantId)
      : getDb().prepare("SELECT * FROM survey_alerts ORDER BY timestamp DESC").all();
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        assignmentId: String(r.assignment_id),
        vehicleId: String(r.vehicle_id),
        severity: r.severity as SupervisorAlert["severity"],
        category: r.category as SupervisorAlert["category"],
        message: String(r.message),
        timestamp: Number(r.timestamp),
        status: r.status as SupervisorAlert["status"],
        acknowledgedBy: r.acknowledged_by != null ? String(r.acknowledged_by) : null,
        acknowledgedAt: r.acknowledged_at != null ? Number(r.acknowledged_at) : null,
        payload: JSON.parse(String(r.payload_json || "{}")),
      };
    });
  }

  // --- Blockages ---
  saveBlockage(b: SurveyBlockageRecord): void {
    if (!this.useSqlite()) {
      memorySurveyStore.blockages.set(b);
      return;
    }
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO survey_blockages (
          id, tenant_id, assignment_id, vehicle_id, route_id, latitude, longitude,
          timestamp, reason, notes, photo_ids_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        b.id,
        b.tenantId,
        b.assignmentId,
        b.vehicleId,
        b.routeId,
        b.latitude,
        b.longitude,
        b.timestamp,
        b.reason,
        b.notes ?? null,
        JSON.stringify(b.photoIds)
      );
  }

  listBlockages(): SurveyBlockageRecord[] {
    if (!this.useSqlite()) return memorySurveyStore.blockages.all();
    const rows = getDb().prepare("SELECT * FROM survey_blockages ORDER BY timestamp DESC").all();
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        assignmentId: String(r.assignment_id),
        vehicleId: String(r.vehicle_id),
        routeId: String(r.route_id),
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        timestamp: Number(r.timestamp),
        reason: r.reason as SurveyBlockageRecord["reason"],
        notes: r.notes != null ? String(r.notes) : undefined,
        photoIds: JSON.parse(String(r.photo_ids_json || "[]")),
      };
    });
  }

  // --- Photos ---
  savePhoto(p: SurveyPhotoMeta): void {
    if (!this.useSqlite()) {
      memorySurveyStore.photos.set(p);
      return;
    }
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO survey_photos (
          id, tenant_id, assignment_id, vehicle_id, blockage_id, filename, stored_path,
          size, content_type, timestamp, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.id,
        p.tenantId,
        p.assignmentId,
        p.vehicleId,
        p.blockageId,
        p.filename,
        p.storedPath,
        p.size,
        p.contentType,
        p.timestamp,
        p.latitude,
        p.longitude
      );
  }

  getPhoto(id: string): SurveyPhotoMeta | null {
    if (!this.useSqlite()) return memorySurveyStore.photos.get(id) ?? null;
    const row = getDb().prepare("SELECT * FROM survey_photos WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      assignmentId: String(row.assignment_id),
      vehicleId: String(row.vehicle_id),
      blockageId: row.blockage_id != null ? String(row.blockage_id) : null,
      filename: String(row.filename),
      storedPath: String(row.stored_path),
      size: Number(row.size),
      contentType: String(row.content_type),
      timestamp: Number(row.timestamp),
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
    };
  }

  deletePhoto(id: string): void {
    if (!this.useSqlite()) {
      memorySurveyStore.photos.delete(id);
      return;
    }
    getDb().prepare("DELETE FROM survey_photos WHERE id = ?").run(id);
  }

  // --- Notifications ---
  saveNotification(n: SurveyNotification): void {
    if (!this.useSqlite()) {
      memorySurveyStore.notifications.set(n);
      return;
    }
    getDb()
      .prepare(
        `INSERT INTO survey_notifications (
          id, tenant_id, vehicle_id, assignment_id, type, title, body, severity,
          timestamp, read, acknowledged, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          read=excluded.read, acknowledged=excluded.acknowledged`
      )
      .run(
        n.id,
        n.tenantId,
        n.vehicleId,
        n.assignmentId,
        n.type,
        n.title,
        n.body,
        n.severity,
        n.timestamp,
        n.read ? 1 : 0,
        n.acknowledged ? 1 : 0,
        JSON.stringify(n.payload)
      );
  }

  listNotifications(tenantId?: string): SurveyNotification[] {
    if (!this.useSqlite()) {
      const all = memorySurveyStore.notifications.all();
      return tenantId ? all.filter((n) => n.tenantId === tenantId) : all;
    }
    const rows = tenantId
      ? getDb().prepare("SELECT * FROM survey_notifications WHERE tenant_id = ? ORDER BY timestamp DESC").all(tenantId)
      : getDb().prepare("SELECT * FROM survey_notifications ORDER BY timestamp DESC").all();
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        vehicleId: r.vehicle_id != null ? String(r.vehicle_id) : null,
        assignmentId: r.assignment_id != null ? String(r.assignment_id) : null,
        type: String(r.type),
        title: String(r.title),
        body: String(r.body),
        severity: String(r.severity),
        timestamp: Number(r.timestamp),
        read: Number(r.read) === 1,
        acknowledged: Number(r.acknowledged) === 1,
        payload: JSON.parse(String(r.payload_json || "{}")),
      };
    });
  }

  // --- Audit ---
  appendAudit(e: SurveyAuditEntry): void {
    if (!this.useSqlite()) {
      memorySurveyStore.audit.push(e);
      return;
    }
    getDb()
      .prepare(
        `INSERT INTO survey_audit (id, tenant_id, assignment_id, vehicle_id, actor, action, timestamp, payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        e.id,
        e.tenantId,
        e.assignmentId,
        e.vehicleId,
        e.actor,
        e.action,
        e.timestamp,
        JSON.stringify(e.payload)
      );
  }

  listAudit(assignmentId?: string): SurveyAuditEntry[] {
    if (!this.useSqlite()) {
      return assignmentId
        ? memorySurveyStore.audit.byAssignment(assignmentId)
        : memorySurveyStore.audit.all();
    }
    const rows = assignmentId
      ? getDb()
          .prepare("SELECT * FROM survey_audit WHERE assignment_id = ? ORDER BY timestamp DESC")
          .all(assignmentId)
      : getDb().prepare("SELECT * FROM survey_audit ORDER BY timestamp DESC LIMIT 500").all();
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        assignmentId: r.assignment_id != null ? String(r.assignment_id) : null,
        vehicleId: r.vehicle_id != null ? String(r.vehicle_id) : null,
        actor: String(r.actor),
        action: String(r.action),
        timestamp: Number(r.timestamp),
        payload: JSON.parse(String(r.payload_json || "{}")),
      };
    });
  }

  // --- Progress ---
  saveProgress(p: SurveyProgressRecord): void {
    if (!this.useSqlite()) {
      memorySurveyStore.progress.set(p);
      return;
    }
    getDb()
      .prepare(
        `INSERT INTO survey_progress (assignment_id, tenant_id, vehicle_id, completion_pct, completed_segment_ids_json, route_state, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(assignment_id) DO UPDATE SET
           completion_pct=excluded.completion_pct,
           completed_segment_ids_json=excluded.completed_segment_ids_json,
           route_state=excluded.route_state,
           updated_at=excluded.updated_at`
      )
      .run(
        p.assignmentId,
        p.tenantId,
        p.vehicleId,
        p.completionPct,
        JSON.stringify(p.completedSegmentIds),
        p.routeState,
        p.updatedAt
      );
  }

  listProgress(): SurveyProgressRecord[] {
    if (!this.useSqlite()) return memorySurveyStore.progress.all();
    const rows = getDb().prepare("SELECT * FROM survey_progress").all();
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        assignmentId: String(r.assignment_id),
        tenantId: String(r.tenant_id),
        vehicleId: String(r.vehicle_id),
        completionPct: Number(r.completion_pct),
        completedSegmentIds: JSON.parse(String(r.completed_segment_ids_json || "[]")),
        routeState: String(r.route_state),
        updatedAt: Number(r.updated_at),
      };
    });
  }
}

export const surveyRepository = new SurveyRepository();
