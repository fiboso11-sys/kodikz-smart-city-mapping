/**
 * Real-time survey sync — SSE transport carrying Socket.IO event names.
 * Single EventSource per tenant; no duplicate listeners.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { SurveySocketEvent } from "@/services/survey/types";
import type { SurveyAssignment } from "@/platform/sge";
import { useRouteAssignmentStore } from "@/store/route-assignment-store";
import { useSgeStore } from "@/store/sge-store";

export type SurveySyncStatus = "connecting" | "connected" | "disconnected" | "error";

let sharedSource: EventSource | null = null;
let sharedTenant: string | null = null;
let refCount = 0;
const listeners = new Set<(event: SurveySocketEvent) => void>();

function dispatch(event: SurveySocketEvent) {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* isolate */
    }
  });
}

function ensureSource(tenantId: string) {
  if (sharedSource && sharedTenant === tenantId) return;
  sharedSource?.close();
  sharedTenant = tenantId;
  const url = `/api/survey-events?tenantId=${encodeURIComponent(tenantId)}&replay=1`;
  sharedSource = new EventSource(url);
  sharedSource.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data) as SurveySocketEvent | { type: string };
      if (!("payload" in data) || !data.type) return;
      dispatch(data as SurveySocketEvent);
    } catch {
      /* ignore parse */
    }
  };
}

function releaseSource() {
  if (refCount > 0) return;
  sharedSource?.close();
  sharedSource = null;
  sharedTenant = null;
}

export function useSurveySync(tenantId = "dubai-giscd"): {
  status: SurveySyncStatus;
  lastEvent: SurveySocketEvent | null;
} {
  const [status, setStatus] = useState<SurveySyncStatus>("connecting");
  const [lastEvent, setLastEvent] = useState<SurveySocketEvent | null>(null);
  const applyRemote = useRouteAssignmentStore((s) => s.applyRemoteAssignment);
  const refresh = useRouteAssignmentStore((s) => s.refresh);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    refCount += 1;
    ensureSource(tenantId);

    const onOpen = () => mounted.current && setStatus("connected");
    const onError = () => mounted.current && setStatus("disconnected");

    sharedSource?.addEventListener("open", onOpen);
    sharedSource?.addEventListener("error", onError);
    if (sharedSource?.readyState === EventSource.OPEN) setStatus("connected");

    const handler = (event: SurveySocketEvent) => {
      if (!mounted.current) return;
      setLastEvent(event);
      const assignment = event.payload.assignment as SurveyAssignment | undefined;
      if (assignment) {
        applyRemote(assignment);
        if (
          event.type === "survey_paused" ||
          event.type === "supervisor_command"
        ) {
          const cmd = event.payload.command as { type?: string; vehicleId?: string } | undefined;
          if (event.type === "survey_paused" && assignment.vehicleId) {
            useSgeStore.getState().pause(assignment.vehicleId);
          }
          if (cmd?.type === "RESUME" && assignment.vehicleId) {
            useSgeStore.getState().resume(assignment.vehicleId);
          }
          if (cmd?.type === "CANCEL" && assignment.vehicleId) {
            useSgeStore.getState().endSession(assignment.vehicleId);
          }
        }
        if (event.type === "survey_resumed" && assignment.vehicleId) {
          useSgeStore.getState().resume(assignment.vehicleId);
        }
        if (event.type === "survey_completed" || event.type === "survey_assignment_updated") {
          if (assignment.status === "CANCELLED" || assignment.status === "COMPLETED") {
            useSgeStore.getState().endSession(assignment.vehicleId);
          }
        }
      }
      if (event.type === "survey_assignment_created") {
        void refresh();
      }
    };

    listeners.add(handler);
    void refresh();

    return () => {
      mounted.current = false;
      listeners.delete(handler);
      sharedSource?.removeEventListener("open", onOpen);
      sharedSource?.removeEventListener("error", onError);
      refCount = Math.max(0, refCount - 1);
      releaseSource();
    };
  }, [tenantId, applyRemote, refresh]);

  return { status, lastEvent };
}
