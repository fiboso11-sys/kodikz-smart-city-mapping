/**
 * Survey Guidance Engine — Type Definitions
 */

export type RouteState =
  | "NOT_STARTED"
  | "ON_ROUTE"
  | "WARNING"
  | "OFF_ROUTE"
  | "RETURNING"
  | "PAUSED"
  | "COMPLETED"
  | "GPS_UNRELIABLE";

export type CompletionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEARLY_COMPLETE"
  | "COMPLETION_CANDIDATE"
  | "COMPLETED";

export type HeadingStatus = "CORRECT" | "MONITOR" | "WRONG_DIRECTION";

export type BlockageReason =
  | "ROAD_CLOSED"
  | "CONSTRUCTION"
  | "POLICE"
  | "ACCIDENT"
  | "UNSAFE"
  | "FLOOD"
  | "OTHER";

export type VoiceEvent =
  | "LEAVING_ROUTE"
  | "WRONG_DIRECTION"
  | "RETURN_TO_ROUTE"
  | "BACK_ON_ROUTE"
  | "STREET_MISSED"
  | "SURVEY_COMPLETE"
  | "BLOCKAGE_RECORDED";

export interface GpsPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: number;
}

export interface RouteSegment {
  id: string;
  index: number;
  startCoord: [number, number];
  endCoord: [number, number];
  lengthMetres: number;
  bearing: number;
  completed: boolean;
  gpsSamples: number;
}

export interface SgeSnapshot {
  vehicleId: string;
  assignmentId: string;
  routeId: string;
  segmentId: string | null;
  timestamp: number;
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  speed: number;
  heading: number;
  distanceFromRoute: number;
  routeState: RouteState;
  previousState: RouteState;
  headingStatus: HeadingStatus;
  completionPct: number;
  completionStatus: CompletionStatus;
  completedLengthMetres: number;
  remainingLengthMetres: number;
  totalLengthMetres: number;
  alertIssued: boolean;
  driverAction: string | null;
}

export interface BlockageReport {
  id: string;
  vehicleId: string;
  assignmentId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  reason: BlockageReason;
  notes?: string;
}

export interface SupervisorVehicleStatus {
  vehicleId: string;
  driverName: string;
  plateNumber: string;
  currentRoad: string;
  routeState: RouteState;
  deviationMetres: number;
  completionPct: number;
  remainingDistanceMetres: number;
  headingStatus: HeadingStatus;
  gpsQuality: "GOOD" | "FAIR" | "POOR" | "UNRELIABLE";
  lastUpdateAt: number;
  wrongDirection: boolean;
}

export interface RouteAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  routeName: string;
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
  assignedAt: number;
  status: "active" | "completed" | "cancelled";
}
