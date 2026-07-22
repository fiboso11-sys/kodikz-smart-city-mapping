/**
 * Survey Timeline — built entirely from Event Bus history.
 */

import { sgeEventBus, type SgePlatformEvent } from "@/platform/sge";

export interface TimelineEntry {
  id: string;
  type: string;
  label: string;
  timestamp: number;
  severity: string;
  vehicleId: string;
  assignmentId: string;
  payload: Record<string, unknown>;
}

const LABELS: Record<string, string> = {
  ASSIGNMENT_CREATED: "Survey Assigned",
  ASSIGNMENT_RESTORED: "Survey Restored",
  SURVEY_STARTED: "Survey Started",
  ON_ROUTE: "On Route",
  WARNING: "Deviation Warning",
  OFF_ROUTE: "Deviation",
  RETURNING: "Returning to Route",
  BACK_ON_ROUTE: "Returned to Route",
  WRONG_DIRECTION: "Wrong Direction",
  GPS_UNRELIABLE: "GPS Lost",
  SEGMENT_COMPLETED: "Segment Completed",
  BLOCKAGE_REPORTED: "Blockage Reported",
  SURVEY_PAUSED: "Paused",
  SURVEY_RESUMED: "Resumed",
  SURVEY_COMPLETED: "Completed",
  SURVEY_CANCELLED: "Cancelled",
};

export function buildSurveyTimeline(filters?: {
  vehicleId?: string;
  assignmentId?: string;
  limit?: number;
}): TimelineEntry[] {
  const limit = filters?.limit ?? 100;
  const events = sgeEventBus.getHistory(500);
  return events
    .filter((e) => {
      if (filters?.vehicleId && e.vehicleId !== filters.vehicleId) return false;
      if (filters?.assignmentId && e.assignmentId !== filters.assignmentId) return false;
      return true;
    })
    .slice(-limit)
    .reverse()
    .map((e: SgePlatformEvent) => ({
      id: e.id,
      type: e.type,
      label: LABELS[e.type] ?? e.type.replace(/_/g, " "),
      timestamp: e.timestamp,
      severity: e.severity,
      vehicleId: e.vehicleId,
      assignmentId: e.assignmentId,
      payload: e.payload,
    }));
}
