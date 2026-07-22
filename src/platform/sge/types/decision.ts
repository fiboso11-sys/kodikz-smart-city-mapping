/**
 * Immutable Decision Object — produced once per GPS tick.
 * All consumers (driver, supervisor, playback, reports) read this.
 * Nothing recalculates route logic from raw GPS.
 */

import type {
  BlockageReport,
  CompletionStatus,
  HeadingStatus,
  RouteState,
  VoiceEvent,
} from "@/engines/sge";

export type DecisionSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface DecisionAlert {
  id: string;
  category: string;
  severity: DecisionSeverity;
  message: string;
}

export interface SurveyDecision {
  readonly id: string;
  readonly assignmentId: string;
  readonly vehicleId: string;
  readonly tenantId: string;
  readonly timestamp: number;
  readonly routeState: RouteState;
  readonly previousRouteState: RouteState;
  readonly completionPct: number;
  readonly completionStatus: CompletionStatus;
  readonly segmentId: string | null;
  readonly nextSegmentId: string | null;
  readonly distanceFromRoute: number;
  readonly headingDifference: number;
  readonly headingStatus: HeadingStatus;
  readonly wrongDirection: boolean;
  readonly gpsAccuracy: number;
  readonly speed: number;
  readonly heading: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly severity: DecisionSeverity;
  readonly voiceEvent: VoiceEvent | null;
  readonly supervisorEvent: string | null;
  readonly blockage: BlockageReport | null;
  readonly alerts: readonly DecisionAlert[];
  readonly completedLengthMetres: number;
  readonly remainingLengthMetres: number;
  readonly totalLengthMetres: number;
  readonly currentRoad: string | null;
}

export function deriveDecisionSeverity(
  routeState: RouteState,
  wrongDirection: boolean
): DecisionSeverity {
  if (routeState === "OFF_ROUTE" || wrongDirection || routeState === "GPS_UNRELIABLE") {
    return "CRITICAL";
  }
  if (routeState === "WARNING" || routeState === "RETURNING") {
    return "WARNING";
  }
  return "INFO";
}
