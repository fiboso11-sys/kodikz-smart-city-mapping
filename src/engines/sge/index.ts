/**
 * Survey Guidance Engine — Public API
 */

export { DEFAULT_SGE_CONFIG, getSgeConfig, setSgeConfig, resetSgeConfig } from "./config";
export type { SgeConfig, SgeCorridorConfig, SgeTimeConfig, SgeHeadingConfig, SgeSegmentConfig, SgeCompletionConfig, SgeVoiceConfig } from "./config";

export type {
  RouteState,
  CompletionStatus,
  HeadingStatus,
  BlockageReason,
  VoiceEvent,
  GpsPoint,
  RouteSegment,
  SgeSnapshot,
  BlockageReport,
  SupervisorVehicleStatus,
  RouteAssignment,
} from "./types";

export { computeCorridorPosition } from "./corridor-engine";
export type { CorridorZone, CorridorResult } from "./corridor-engine";

export { computeHeading, createHeadingContext } from "./heading-engine";
export type { HeadingContext, HeadingInput, HeadingResult } from "./heading-engine";

export { computeNextState, createStateMachineContext } from "./state-machine";
export type { StateMachineContext, TransitionInput } from "./state-machine";

export { createSegments, updateSegments } from "./segment-engine";
export type { SegmentContext, SegmentUpdateInput, SegmentUpdateResult } from "./segment-engine";

export { computeCompletion } from "./completion-engine";
export type { CompletionResult } from "./completion-engine";

export { emitVoiceEvent, createVoiceContext, clearPendingEvents, getVoiceMessage } from "./voice-engine";
export type { VoiceContext, VoiceResult } from "./voice-engine";

export { reportBlockage, createBlockageContext, acknowledgePendingNotifications, getBlockagesForRoute } from "./blockage-engine";
export type { BlockageContext, BlockageInput } from "./blockage-engine";

export { createSession, processGpsTick, pauseSession, resumeSession } from "./survey-guidance-engine";
export type { SgeSessionState } from "./survey-guidance-engine";

export {
  haversineDistance,
  bearing,
  headingDifference,
  pointToPolylineDistance,
  polylineLength,
  extractCoords,
} from "./geo-math";
