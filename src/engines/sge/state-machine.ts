/**
 * Survey Guidance Engine — State Machine
 *
 * Implements hysteresis-based route state transitions.
 * Prevents flickering by requiring sustained conditions before state changes.
 */

import { getSgeConfig } from "./config";
import type { GpsPoint, RouteState } from "./types";

export interface StateMachineContext {
  currentState: RouteState;
  stateEnteredAt: number;
  offRouteSince: number | null;
  returningSince: number | null;
  lastOnRouteAt: number | null;
  consecutiveOffRouteMs: number;
}

export function createStateMachineContext(): StateMachineContext {
  return {
    currentState: "NOT_STARTED",
    stateEnteredAt: Date.now(),
    offRouteSince: null,
    returningSince: null,
    lastOnRouteAt: null,
    consecutiveOffRouteMs: 0,
  };
}

export interface TransitionInput {
  distanceFromRoute: number;
  gpsAccuracy: number;
  speed: number;
  timestamp: number;
  completionPct: number;
  isPaused: boolean;
}

export function computeNextState(
  ctx: StateMachineContext,
  input: TransitionInput
): { nextState: RouteState; updatedCtx: StateMachineContext } {
  const cfg = getSgeConfig();
  const { corridor, time } = cfg;
  const { currentState } = ctx;
  const { distanceFromRoute, gpsAccuracy, timestamp, completionPct, isPaused } = input;

  let nextState: RouteState = currentState;
  const updatedCtx = { ...ctx };

  if (gpsAccuracy > corridor.gpsUnreliableAccuracyMetres) {
    if (currentState !== "GPS_UNRELIABLE") {
      nextState = "GPS_UNRELIABLE";
      updatedCtx.stateEnteredAt = timestamp;
    }
    return { nextState, updatedCtx };
  }

  if (isPaused && currentState !== "COMPLETED") {
    if (currentState !== "PAUSED") {
      nextState = "PAUSED";
      updatedCtx.stateEnteredAt = timestamp;
    }
    return { nextState, updatedCtx };
  }

  if (completionPct >= cfg.completion.completedPct) {
    if (currentState !== "COMPLETED") {
      nextState = "COMPLETED";
      updatedCtx.stateEnteredAt = timestamp;
    }
    return { nextState, updatedCtx };
  }

  const isWithinCorridor = distanceFromRoute <= corridor.onRouteMetres;
  const isWarningZone =
    distanceFromRoute > corridor.onRouteMetres &&
    distanceFromRoute <= corridor.warningMetres;
  const isOffRoute = distanceFromRoute > corridor.offRouteMetres;

  switch (currentState) {
    case "NOT_STARTED": {
      if (isWithinCorridor) {
        nextState = "ON_ROUTE";
        updatedCtx.stateEnteredAt = timestamp;
        updatedCtx.lastOnRouteAt = timestamp;
      }
      break;
    }

    case "ON_ROUTE": {
      updatedCtx.lastOnRouteAt = timestamp;
      updatedCtx.offRouteSince = null;
      updatedCtx.consecutiveOffRouteMs = 0;

      if (isWarningZone) {
        nextState = "WARNING";
        updatedCtx.stateEnteredAt = timestamp;
        updatedCtx.offRouteSince = timestamp;
      } else if (isOffRoute) {
        nextState = "OFF_ROUTE";
        updatedCtx.stateEnteredAt = timestamp;
        updatedCtx.offRouteSince = timestamp;
      }
      break;
    }

    case "WARNING": {
      if (isWithinCorridor) {
        // Hysteresis: require sustained return before transitioning back
        if (!updatedCtx.returningSince) {
          updatedCtx.returningSince = timestamp;
        }
        const returningMs = timestamp - updatedCtx.returningSince;
        if (returningMs >= time.hysteresisReturnMs) {
          nextState = "ON_ROUTE";
          updatedCtx.stateEnteredAt = timestamp;
          updatedCtx.lastOnRouteAt = timestamp;
          updatedCtx.offRouteSince = null;
          updatedCtx.returningSince = null;
          updatedCtx.consecutiveOffRouteMs = 0;
        }
      } else {
        updatedCtx.returningSince = null;
        if (isOffRoute) {
          const offMs = updatedCtx.offRouteSince
            ? timestamp - updatedCtx.offRouteSince
            : 0;
          updatedCtx.consecutiveOffRouteMs = offMs;
          if (offMs >= time.visualWarningMs) {
            nextState = "OFF_ROUTE";
            updatedCtx.stateEnteredAt = timestamp;
          }
        }
      }
      break;
    }

    case "OFF_ROUTE": {
      updatedCtx.returningSince = null;

      if (isWithinCorridor || isWarningZone) {
        nextState = "RETURNING";
        updatedCtx.stateEnteredAt = timestamp;
        updatedCtx.returningSince = timestamp;
      } else {
        const offMs = updatedCtx.offRouteSince
          ? timestamp - updatedCtx.offRouteSince
          : 0;
        updatedCtx.consecutiveOffRouteMs = offMs;
      }
      break;
    }

    case "RETURNING": {
      if (isWithinCorridor) {
        const returningMs = updatedCtx.returningSince
          ? timestamp - updatedCtx.returningSince
          : time.hysteresisReturnMs;
        if (returningMs >= time.hysteresisReturnMs) {
          nextState = "ON_ROUTE";
          updatedCtx.stateEnteredAt = timestamp;
          updatedCtx.lastOnRouteAt = timestamp;
          updatedCtx.offRouteSince = null;
          updatedCtx.returningSince = null;
          updatedCtx.consecutiveOffRouteMs = 0;
        }
      } else if (isOffRoute) {
        nextState = "OFF_ROUTE";
        updatedCtx.stateEnteredAt = timestamp;
        updatedCtx.returningSince = null;
      }
      break;
    }

    case "PAUSED": {
      if (!isPaused) {
        nextState = isWithinCorridor ? "ON_ROUTE" : "WARNING";
        updatedCtx.stateEnteredAt = timestamp;
      }
      break;
    }

    case "GPS_UNRELIABLE": {
      if (gpsAccuracy <= corridor.gpsUnreliableAccuracyMetres) {
        nextState = isWithinCorridor ? "ON_ROUTE" : "WARNING";
        updatedCtx.stateEnteredAt = timestamp;
      }
      break;
    }

    case "COMPLETED":
      break;
  }

  if (nextState !== currentState) {
    updatedCtx.currentState = nextState;
  }

  return { nextState, updatedCtx };
}
