/**
 * Survey real-time event hub.
 * Emits Socket.IO-compatible event names over SSE / in-process subscribers.
 */

import type { SurveySocketEvent, SurveySocketEventType } from "@/services/survey/types";

type Listener = (event: SurveySocketEvent) => void;

const g = globalThis as unknown as {
  __kodikzSurveyHub?: {
    listeners: Set<Listener>;
    history: SurveySocketEvent[];
  };
};

function hub() {
  if (!g.__kodikzSurveyHub) {
    g.__kodikzSurveyHub = { listeners: new Set(), history: [] };
  }
  return g.__kodikzSurveyHub;
}

export function publishSurveyEvent(
  type: SurveySocketEventType,
  tenantId: string,
  payload: Record<string, unknown>
): SurveySocketEvent {
  const event: SurveySocketEvent = {
    type,
    timestamp: Date.now(),
    tenantId,
    payload,
  };
  const h = hub();
  h.history.push(event);
  if (h.history.length > 1000) h.history = h.history.slice(-1000);
  h.listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* isolate */
    }
  });

  // Bridge to realtime adapter (SSE / future Socket.IO)
  void import("./realtime-adapter")
    .then(({ getSurveyRealtimeAdapter, normalizeFromSocketEvent }) => {
      const normalized = normalizeFromSocketEvent(
        event,
        typeof payload.eventId === "string" ? payload.eventId : undefined
      );
      return getSurveyRealtimeAdapter().publish(normalized);
    })
    .catch(() => undefined);

  return event;
}

export function subscribeSurveyEvents(listener: Listener): () => void {
  hub().listeners.add(listener);
  return () => hub().listeners.delete(listener);
}

export function getSurveyEventHistory(limit = 100): SurveySocketEvent[] {
  return hub().history.slice(-limit);
}
