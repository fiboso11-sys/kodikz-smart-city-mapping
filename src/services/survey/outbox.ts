/**
 * Transactional outbox — persist events with domain changes, worker publishes later.
 */

import { v4 as uuidv4 } from "uuid";
import { isPostgresConfigured, pgQuery, withTransaction } from "@/lib/db/postgres/pool";
import { publishSurveyEvent } from "@/services/survey/event-hub";
import type { SurveySocketEventType } from "@/services/survey/types";
import type { PoolClient } from "pg";

export interface OutboxEvent {
  id: string;
  tenantId: string;
  eventType: SurveySocketEventType | string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  revision: number;
  status: "PENDING" | "PROCESSING" | "PUBLISHED" | "FAILED";
  attempts: number;
  createdAt: number;
}

/** In-memory outbox for local/SQLite mode */
const memoryOutbox: OutboxEvent[] = [];

export async function enqueueOutbox(
  event: Omit<OutboxEvent, "id" | "status" | "attempts" | "createdAt" | "revision"> & {
    revision?: number;
  },
  client?: PoolClient
): Promise<OutboxEvent> {
  const full: OutboxEvent = {
    id: `out-${uuidv4()}`,
    tenantId: event.tenantId,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    payload: event.payload,
    revision: event.revision ?? 1,
    status: "PENDING",
    attempts: 0,
    createdAt: Date.now(),
  };

  if (client) {
    await client.query(
      `INSERT INTO event_outbox (id, tenant_id, event_type, aggregate_type, aggregate_id, payload_json, revision, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING')`,
      [
        full.id,
        full.tenantId,
        full.eventType,
        full.aggregateType,
        full.aggregateId,
        JSON.stringify(full.payload),
        full.revision,
      ]
    );
    return full;
  }

  if (isPostgresConfigured()) {
    await pgQuery(
      `INSERT INTO event_outbox (id, tenant_id, event_type, aggregate_type, aggregate_id, payload_json, revision, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING')`,
      [
        full.id,
        full.tenantId,
        full.eventType,
        full.aggregateType,
        full.aggregateId,
        JSON.stringify(full.payload),
        full.revision,
      ]
    );
  } else {
    memoryOutbox.push(full);
  }
  return full;
}

export async function processOutboxBatch(limit = 50): Promise<{ published: number; failed: number }> {
  let published = 0;
  let failed = 0;

  if (isPostgresConfigured()) {
    const rows = await pgQuery<{
      id: string;
      tenant_id: string;
      event_type: string;
      payload_json: unknown;
    }>(
      `SELECT id, tenant_id, event_type, payload_json FROM event_outbox
       WHERE status = 'PENDING' AND available_at <= NOW()
       ORDER BY created_at ASC LIMIT $1`,
      [limit]
    );
    for (const row of rows.rows) {
      try {
        await pgQuery(`UPDATE event_outbox SET status='PROCESSING', attempts=attempts+1, updated_at=NOW() WHERE id=$1`, [
          row.id,
        ]);
        publishSurveyEvent(row.event_type as SurveySocketEventType, row.tenant_id, {
          ...(typeof row.payload_json === "object" && row.payload_json ? (row.payload_json as object) : {}),
          eventId: row.id,
        });
        await pgQuery(
          `UPDATE event_outbox SET status='PUBLISHED', published_at=NOW(), updated_at=NOW() WHERE id=$1`,
          [row.id]
        );
        published += 1;
      } catch (err) {
        failed += 1;
        await pgQuery(
          `UPDATE event_outbox SET status='FAILED', last_error=$2, available_at=NOW() + INTERVAL '30 seconds', updated_at=NOW() WHERE id=$1`,
          [row.id, err instanceof Error ? err.message : "publish_failed"]
        );
      }
    }
    return { published, failed };
  }

  const pending = memoryOutbox.filter((e) => e.status === "PENDING").slice(0, limit);
  for (const ev of pending) {
    try {
      ev.status = "PROCESSING";
      ev.attempts += 1;
      publishSurveyEvent(ev.eventType as SurveySocketEventType, ev.tenantId, {
        ...ev.payload,
        eventId: ev.id,
        revision: ev.revision,
      });
      ev.status = "PUBLISHED";
      published += 1;
    } catch {
      ev.status = "FAILED";
      failed += 1;
    }
  }
  return { published, failed };
}

export async function outboxPendingCount(): Promise<number> {
  if (isPostgresConfigured()) {
    const r = await pgQuery<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM event_outbox WHERE status='PENDING'`
    );
    return Number(r.rows[0]?.c ?? 0);
  }
  return memoryOutbox.filter((e) => e.status === "PENDING").length;
}

export { withTransaction };
