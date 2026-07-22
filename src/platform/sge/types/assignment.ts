/**
 * Production Survey Assignment model.
 * Survives refresh / reconnect; is the ONLY source of active survey context.
 */

export type AssignmentStatus =
  | "DRAFT"
  | "ASSIGNED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type SurveyType = "STREET_MAPPING" | "AREA_SURVEY" | "REVISIT" | "OTHER";

export type AssignmentPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface SurveyAssignment {
  id: string;
  tenantId: string;
  vehicleId: string;
  driverId: string | null;
  routeId: string;
  routeName: string;
  permitId: string | null;
  surveyType: SurveyType;
  priority: AssignmentPriority;
  plannedStart: number | null;
  plannedEnd: number | null;
  actualStart: number | null;
  actualEnd: number | null;
  status: AssignmentStatus;
  createdBy: string;
  approvedBy: string | null;
  createdAt: number;
  updatedAt: number;
  /** Route geometry required by SGE — never recalculated in UI */
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
}

export interface CreateAssignmentInput {
  tenantId: string;
  vehicleId: string;
  driverId?: string | null;
  routeId: string;
  routeName: string;
  permitId?: string | null;
  surveyType?: SurveyType;
  priority?: AssignmentPriority;
  plannedStart?: number | null;
  plannedEnd?: number | null;
  createdBy: string;
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
}

export const ACTIVE_ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  "ASSIGNED",
  "ACTIVE",
  "PAUSED",
];
