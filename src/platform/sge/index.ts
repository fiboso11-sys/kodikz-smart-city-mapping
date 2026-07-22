/**
 * Kodikz Survey Guidance Platform — Public API
 *
 * Assignment Manager → Session Manager → Decision Bus → Event Bus → Persistence
 * SGE engine remains the ONLY source of survey decisions.
 */

export type {
  SurveyAssignment,
  AssignmentStatus,
  CreateAssignmentInput,
  SurveyType,
  AssignmentPriority,
} from "./types/assignment";
export { ACTIVE_ASSIGNMENT_STATUSES } from "./types/assignment";

export type {
  SurveyDecision,
  DecisionSeverity,
  DecisionAlert,
} from "./types/decision";
export { deriveDecisionSeverity } from "./types/decision";

export type {
  SgePlatformEvent,
  SgePlatformEventType,
  EventSeverity,
  EventSubscriber,
} from "./types/events";

export type {
  SupervisorAlert,
  AlertSeverity,
  AlertStatus,
  AlertCategory,
  AlertFilters,
} from "./types/alert";

export { assignmentManager, AssignmentManager } from "./assignment/assignment-manager";
export { sessionManager, SessionManager } from "./session/session-manager";
export type { SessionProgressSnapshot } from "./session/session-manager";

export { decisionBus, DecisionBus } from "./decision-bus/decision-bus";
export type { DecisionSubscriber } from "./decision-bus/decision-bus";

export { sgeEventBus, SgeEventBus } from "./event-bus/event-bus";

export { alertCenter, AlertCenter } from "./alerts/alert-center";

export {
  roadResolver,
  RoadResolver,
  PlaceholderRoadProvider,
} from "./geo/road-resolver";
export type { RoadProvider, RoadResolveResult } from "./geo/road-resolver";
export { NominatimRoadProvider } from "./geo/nominatim-provider";

export { offlineQueue, OfflineQueue } from "./offline/offline-queue";
export type { OfflineQueueItem, OfflineOpType, OfflineSyncHandler } from "./offline/offline-queue";

export {
  driverCopilot,
  BrowserDriverCopilot,
} from "./copilot/driver-copilot";
export type {
  DriverCopilotService,
  DriverCopilotState,
  GpsHealthStatus,
  BatteryStatus,
} from "./copilot/driver-copilot";

export {
  loadJson,
  saveJson,
  SGE_STORAGE_KEYS,
} from "./persistence/storage";

import { assignmentManager } from "./assignment/assignment-manager";
import { sessionManager } from "./session/session-manager";
import { roadResolver } from "./geo/road-resolver";

export { voiceCopilot, VoiceCopilotQueue, getCopilotVoiceMessage } from "./voice/voice-copilot";
export type { CopilotVoiceCue, VoiceHistoryEntry } from "./voice/voice-copilot";

export { buildSurveyTimeline } from "./timeline/survey-timeline";
export type { TimelineEntry } from "./timeline/survey-timeline";

/**
 * Bootstrap platform after app load:
 * restore assignments and recreate SGE sessions for active surveys.
 */
export function bootstrapSgePlatform(): void {
  // Prefer real reverse geocoding in browser; cache still avoids spam
  if (typeof window !== "undefined") {
    void import("./geo/nominatim-provider").then(({ NominatimRoadProvider }) => {
      roadResolver.setProvider(new NominatimRoadProvider());
    });
  }

  const active = assignmentManager.restoreActiveAssignments();
  for (const a of active) {
    if (!sessionManager.hasSession(a.vehicleId)) {
      sessionManager.startSession(a);
    }
  }
}
