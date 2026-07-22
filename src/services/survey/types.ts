/**
 * Survey domain types for production persistence / API.
 */

import type { SurveyAssignment } from "@/platform/sge";
import type { SurveyDecision } from "@/platform/sge";
import type { SupervisorAlert } from "@/platform/sge";
import type { BlockageReport } from "@/engines/sge";

export type { SurveyAssignment, SurveyDecision, SupervisorAlert };

export interface SurveyPhotoMeta {
  id: string;
  tenantId: string;
  assignmentId: string;
  vehicleId: string;
  blockageId: string | null;
  filename: string;
  storedPath: string;
  size: number;
  contentType: string;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
}

export interface SurveyNotification {
  id: string;
  tenantId: string;
  vehicleId: string | null;
  assignmentId: string | null;
  type: string;
  title: string;
  body: string;
  severity: string;
  timestamp: number;
  read: boolean;
  acknowledged: boolean;
  payload: Record<string, unknown>;
}

export interface SurveyAuditEntry {
  id: string;
  tenantId: string;
  assignmentId: string | null;
  vehicleId: string | null;
  actor: string;
  action: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface SurveyProgressRecord {
  assignmentId: string;
  tenantId: string;
  vehicleId: string;
  completionPct: number;
  completedSegmentIds: string[];
  routeState: string;
  updatedAt: number;
}

export interface SurveyBlockageRecord extends BlockageReport {
  tenantId: string;
  photoIds: string[];
}

export type SurveySocketEventType =
  | "survey_assignment_created"
  | "survey_assignment_updated"
  | "survey_started"
  | "survey_paused"
  | "survey_resumed"
  | "survey_completed"
  | "survey_decision_updated"
  | "survey_alert_created"
  | "survey_alert_acknowledged"
  | "blockage_reported"
  | "supervisor_command"
  | "driver_message"
  | "survey_photo_uploaded"
  | "survey_notification";

export interface SurveySocketEvent {
  type: SurveySocketEventType;
  timestamp: number;
  tenantId: string;
  payload: Record<string, unknown>;
}

export type SupervisorCommandType =
  | "PAUSE"
  | "RESUME"
  | "CANCEL"
  | "APPROVE_DIVERSION"
  | "REJECT_DIVERSION"
  | "SEND_MESSAGE"
  | "REQUEST_RETURN";

export interface SupervisorCommand {
  id: string;
  type: SupervisorCommandType;
  tenantId: string;
  assignmentId: string;
  vehicleId: string;
  message?: string;
  issuedBy: string;
  timestamp: number;
}
