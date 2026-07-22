/**
 * Survey realtime transport abstraction.
 * Pilot: SSE. Future: Socket.IO survey adapter without changing UI stores.
 */

import type { SurveySocketEvent } from "@/services/survey/types";

export interface NormalizedSurveyEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  assignmentId?: string | null;
  vehicleId?: string | null;
  timestamp: number;
  revision: number;
  payload: Record<string, unknown>;
}

export interface SurveyRealtimeAdapter {
  name: string;
  publish(event: NormalizedSurveyEvent): Promise<void>;
  subscribe(tenantId: string, handler: (event: NormalizedSurveyEvent) => void): () => void;
  health(): Promise<{ ok: boolean; clients?: number }>;
  close(): Promise<void>;
}

type Handler = (event: NormalizedSurveyEvent) => void;

class SseRealtimeAdapter implements SurveyRealtimeAdapter {
  name = "sse";
  private handlers = new Map<string, Set<Handler>>();
  private history: NormalizedSurveyEvent[] = [];

  async publish(event: NormalizedSurveyEvent): Promise<void> {
    this.history.push(event);
    if (this.history.length > 2000) this.history = this.history.slice(-2000);
    const set = this.handlers.get(event.tenantId);
    set?.forEach((h) => {
      try {
        h(event);
      } catch {
        /* isolate */
      }
    });
  }

  subscribe(tenantId: string, handler: Handler): () => void {
    if (!this.handlers.has(tenantId)) this.handlers.set(tenantId, new Set());
    this.handlers.get(tenantId)!.add(handler);
    return () => this.handlers.get(tenantId)?.delete(handler);
  }

  replay(tenantId: string, afterEventId?: string): NormalizedSurveyEvent[] {
    let list = this.history.filter((e) => e.tenantId === tenantId);
    if (afterEventId) {
      const idx = list.findIndex((e) => e.eventId === afterEventId);
      if (idx >= 0) list = list.slice(idx + 1);
    }
    return list.slice(-100);
  }

  async health() {
    let clients = 0;
    this.handlers.forEach((s) => {
      clients += s.size;
    });
    return { ok: true, clients };
  }

  async close() {
    this.handlers.clear();
  }
}

/** Future Socket.IO survey adapter placeholder */
class SocketIoSurveyAdapter implements SurveyRealtimeAdapter {
  name = "socket.io-survey";
  async publish(): Promise<void> {
    throw new Error("Socket.IO survey adapter not wired — use SSE for pilot");
  }
  subscribe(): () => void {
    return () => undefined;
  }
  async health() {
    return { ok: false };
  }
  async close() {}
}

let adapter: SurveyRealtimeAdapter = new SseRealtimeAdapter();

export function getSurveyRealtimeAdapter(): SurveyRealtimeAdapter {
  return adapter;
}

export function setSurveyRealtimeAdapter(next: SurveyRealtimeAdapter): void {
  adapter = next;
}

export function normalizeFromSocketEvent(ev: SurveySocketEvent, eventId?: string): NormalizedSurveyEvent {
  const payload = ev.payload ?? {};
  return {
    eventId: eventId ?? String(payload.eventId ?? `evt-${ev.timestamp}`),
    eventType: ev.type,
    tenantId: ev.tenantId,
    assignmentId: (payload.assignment as { id?: string } | undefined)?.id ?? (payload.assignmentId as string) ?? null,
    vehicleId: (payload.assignment as { vehicleId?: string } | undefined)?.vehicleId ?? (payload.vehicleId as string) ?? null,
    timestamp: ev.timestamp,
    revision: Number(payload.revision ?? 1),
    payload,
  };
}

export function createSocketIoSurveyAdapter(): SurveyRealtimeAdapter {
  return new SocketIoSurveyAdapter();
}

export function getSseAdapter(): SseRealtimeAdapter {
  return adapter as SseRealtimeAdapter;
}
