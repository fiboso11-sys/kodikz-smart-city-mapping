/**
 * Survey Guidance Engine — Heading Engine
 *
 * Calculates heading alignment between the vehicle and its assigned route.
 * Implements wrong-direction detection with speed-based ignore and duration thresholds.
 */

import { getSgeConfig } from "./config";
import { bearing, extractCoords, headingDifference } from "./geo-math";
import type { HeadingStatus, RouteAssignment } from "./types";

export interface HeadingContext {
  wrongDirectionSince: number | null;
  lastHeadingStatus: HeadingStatus;
}

export function createHeadingContext(): HeadingContext {
  return {
    wrongDirectionSince: null,
    lastHeadingStatus: "CORRECT",
  };
}

export interface HeadingInput {
  vehicleHeading: number;
  speed: number;
  nearestSegmentIndex: number;
  timestamp: number;
}

export interface HeadingResult {
  vehicleHeading: number;
  routeHeading: number;
  difference: number;
  status: HeadingStatus;
  wrongDirection: boolean;
  updatedCtx: HeadingContext;
}

export function computeHeading(
  ctx: HeadingContext,
  input: HeadingInput,
  assignment: RouteAssignment
): HeadingResult {
  const cfg = getSgeConfig().heading;
  const coords = extractCoords(assignment.geometry);
  const { vehicleHeading, speed, nearestSegmentIndex, timestamp } = input;

  const segIdx = Math.min(nearestSegmentIndex, coords.length - 2);
  const [aLon, aLat] = coords[segIdx];
  const [bLon, bLat] = coords[segIdx + 1];
  const routeHeading = bearing(aLat, aLon, bLat, bLon);

  const diff = headingDifference(vehicleHeading, routeHeading);

  const updatedCtx = { ...ctx };

  if (speed < cfg.ignoreSpeedKmh) {
    updatedCtx.wrongDirectionSince = null;
    updatedCtx.lastHeadingStatus = "CORRECT";
    return {
      vehicleHeading,
      routeHeading,
      difference: diff,
      status: "CORRECT",
      wrongDirection: false,
      updatedCtx,
    };
  }

  let status: HeadingStatus;
  if (diff <= cfg.correctDeg) {
    status = "CORRECT";
    updatedCtx.wrongDirectionSince = null;
  } else if (diff <= cfg.monitorDeg) {
    status = "MONITOR";
    updatedCtx.wrongDirectionSince = null;
  } else {
    status = "WRONG_DIRECTION";
    if (!ctx.wrongDirectionSince) {
      updatedCtx.wrongDirectionSince = timestamp;
    }
  }

  const wrongDurationMs = updatedCtx.wrongDirectionSince
    ? timestamp - updatedCtx.wrongDirectionSince
    : 0;
  const wrongDirection =
    status === "WRONG_DIRECTION" && wrongDurationMs >= cfg.wrongDirectionDurationMs;

  updatedCtx.lastHeadingStatus = status;

  return {
    vehicleHeading,
    routeHeading,
    difference: diff,
    status,
    wrongDirection,
    updatedCtx,
  };
}
