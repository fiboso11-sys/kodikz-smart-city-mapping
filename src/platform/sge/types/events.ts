/**
 * Platform Event Bus event types.
 */

export type SgePlatformEventType =
  | "SURVEY_STARTED"
  | "ON_ROUTE"
  | "WARNING"
  | "OFF_ROUTE"
  | "RETURNING"
  | "BACK_ON_ROUTE"
  | "WRONG_DIRECTION"
  | "GPS_UNRELIABLE"
  | "SEGMENT_COMPLETED"
  | "BLOCKAGE_REPORTED"
  | "SURVEY_PAUSED"
  | "SURVEY_RESUMED"
  | "SURVEY_COMPLETED"
  | "SURVEY_CANCELLED"
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_RESTORED";

export type EventSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface SgePlatformEvent {
  id: string;
  type: SgePlatformEventType;
  timestamp: number;
  tenantId: string;
  vehicleId: string;
  assignmentId: string;
  severity: EventSeverity;
  payload: Record<string, unknown>;
}

export type EventSubscriber = (event: SgePlatformEvent) => void;
