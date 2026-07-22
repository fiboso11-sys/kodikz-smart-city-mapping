/**
 * Survey Guidance Engine — Main Orchestrator
 *
 * Coordinates all sub-engines (state machine, corridor, heading, segment,
 * completion, voice, blockage) into a single coherent update cycle.
 *
 * Each GPS tick calls `processGpsTick()` which runs the full pipeline:
 *   GPS → Corridor → Heading → Segment → Completion → State Machine → Voice
 */

import { computeCorridorPosition } from "./corridor-engine";
import { computeCompletion } from "./completion-engine";
import {
  computeHeading,
  createHeadingContext,
  type HeadingContext,
} from "./heading-engine";
import {
  computeNextState,
  createStateMachineContext,
  type StateMachineContext,
} from "./state-machine";
import {
  createSegments,
  updateSegments,
  type SegmentContext,
} from "./segment-engine";
import {
  createVoiceContext,
  emitVoiceEvent,
  type VoiceContext,
} from "./voice-engine";
import {
  createBlockageContext,
  type BlockageContext,
} from "./blockage-engine";
import type {
  GpsPoint,
  RouteAssignment,
  RouteState,
  SgeSnapshot,
  VoiceEvent,
} from "./types";
import { getSgeConfig } from "./config";

export interface SgeSessionState {
  vehicleId: string;
  assignment: RouteAssignment;
  stateMachine: StateMachineContext;
  heading: HeadingContext;
  segments: SegmentContext;
  voice: VoiceContext;
  blockage: BlockageContext;
  lastSnapshot: SgeSnapshot | null;
  isPaused: boolean;
  startedAt: number;
}

export function createSession(
  vehicleId: string,
  assignment: RouteAssignment
): SgeSessionState {
  return {
    vehicleId,
    assignment,
    stateMachine: createStateMachineContext(),
    heading: createHeadingContext(),
    segments: createSegments(assignment),
    voice: createVoiceContext(),
    blockage: createBlockageContext(),
    lastSnapshot: null,
    isPaused: false,
    startedAt: Date.now(),
  };
}

export function processGpsTick(
  session: SgeSessionState,
  gps: GpsPoint
): { snapshot: SgeSnapshot; updatedSession: SgeSessionState; voiceEvents: VoiceEvent[] } {
  const cfg = getSgeConfig();
  const voiceEvents: VoiceEvent[] = [];
  let updatedSession = { ...session };

  // 1. Corridor position
  const corridor = computeCorridorPosition(
    gps.latitude,
    gps.longitude,
    session.assignment
  );

  // 2. Heading
  const headingResult = computeHeading(
    session.heading,
    {
      vehicleHeading: gps.heading,
      speed: gps.speed,
      nearestSegmentIndex: corridor.nearestSegmentIndex,
      timestamp: gps.timestamp,
    },
    session.assignment
  );
  updatedSession.heading = headingResult.updatedCtx;

  // 3. Segment tracking
  const segResult = updateSegments(session.segments, {
    nearestSegmentIndex: corridor.nearestSegmentIndex,
    distanceFromRoute: corridor.distanceMetres,
    speed: gps.speed,
    headingCorrect: headingResult.status === "CORRECT",
    gpsAccuracy: gps.accuracy,
  });
  updatedSession.segments = segResult.updatedCtx;

  // 4. Completion
  const completion = computeCompletion(
    segResult.completedLengthMetres,
    session.segments.totalLengthMetres
  );

  // 5. State machine
  const prevState = session.stateMachine.currentState;
  const { nextState, updatedCtx: smCtx } = computeNextState(
    session.stateMachine,
    {
      distanceFromRoute: corridor.distanceMetres,
      gpsAccuracy: gps.accuracy,
      speed: gps.speed,
      timestamp: gps.timestamp,
      completionPct: completion.completionPct,
      isPaused: session.isPaused,
    }
  );
  updatedSession.stateMachine = smCtx;

  // 6. Voice events based on state transitions
  let voiceCtx = session.voice;
  const triggerVoice = (evt: VoiceEvent) => {
    const result = emitVoiceEvent(voiceCtx, evt, gps.timestamp);
    voiceCtx = result.updatedCtx;
    if (result.spoken) voiceEvents.push(evt);
  };

  if (prevState !== nextState) {
    if (nextState === "OFF_ROUTE" || nextState === "WARNING") {
      triggerVoice("LEAVING_ROUTE");
    }
    if (nextState === "ON_ROUTE" && (prevState === "OFF_ROUTE" || prevState === "RETURNING")) {
      triggerVoice("BACK_ON_ROUTE");
    }
    if (nextState === "RETURNING") {
      triggerVoice("RETURN_TO_ROUTE");
    }
    if (nextState === "COMPLETED") {
      triggerVoice("SURVEY_COMPLETE");
    }
  }

  if (headingResult.wrongDirection && !session.heading.wrongDirectionSince) {
    triggerVoice("WRONG_DIRECTION");
  }

  updatedSession.voice = voiceCtx;

  // 7. Time-based alerts
  const offMs = updatedSession.stateMachine.consecutiveOffRouteMs;
  if (
    (nextState === "OFF_ROUTE" || nextState === "WARNING") &&
    offMs >= cfg.time.voiceWarningMs &&
    offMs < cfg.time.voiceWarningMs + 1500
  ) {
    triggerVoice("RETURN_TO_ROUTE");
    updatedSession.voice = voiceCtx;
  }

  // Build snapshot
  const snapshot: SgeSnapshot = {
    vehicleId: session.vehicleId,
    assignmentId: session.assignment.id,
    routeId: session.assignment.routeId,
    segmentId: updatedSession.segments.segments[updatedSession.segments.currentSegmentIndex]?.id ?? null,
    timestamp: gps.timestamp,
    latitude: gps.latitude,
    longitude: gps.longitude,
    gpsAccuracy: gps.accuracy,
    speed: gps.speed,
    heading: gps.heading,
    distanceFromRoute: corridor.distanceMetres,
    routeState: nextState,
    previousState: prevState,
    headingStatus: headingResult.status,
    completionPct: completion.completionPct,
    completionStatus: completion.status,
    completedLengthMetres: completion.completedLengthMetres,
    remainingLengthMetres: completion.remainingLengthMetres,
    totalLengthMetres: completion.totalLengthMetres,
    alertIssued: voiceEvents.length > 0,
    driverAction: null,
  };

  updatedSession.lastSnapshot = snapshot;

  return { snapshot, updatedSession, voiceEvents };
}

export function pauseSession(session: SgeSessionState): SgeSessionState {
  return { ...session, isPaused: true };
}

export function resumeSession(session: SgeSessionState): SgeSessionState {
  return { ...session, isPaused: false };
}
