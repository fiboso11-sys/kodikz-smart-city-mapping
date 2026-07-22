/**
 * Supervisor Alert Center model.
 */

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "DISMISSED";
export type AlertCategory =
  | "ROUTE_DEVIATION"
  | "WRONG_DIRECTION"
  | "GPS_QUALITY"
  | "BLOCKAGE"
  | "COMPLETION"
  | "SYSTEM";

export interface SupervisorAlert {
  id: string;
  tenantId: string;
  assignmentId: string;
  vehicleId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  timestamp: number;
  status: AlertStatus;
  acknowledgedBy: string | null;
  acknowledgedAt: number | null;
  payload: Record<string, unknown>;
}

export interface AlertFilters {
  vehicleId?: string;
  severity?: AlertSeverity;
  assignmentId?: string;
  status?: AlertStatus;
  category?: AlertCategory;
}
