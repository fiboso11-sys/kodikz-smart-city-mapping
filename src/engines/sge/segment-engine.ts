/**
 * Survey Guidance Engine — Segment Engine
 *
 * Splits a route into segments and tracks which segments are completed.
 * A segment is completed when the vehicle passes through it with:
 * - Valid GPS
 * - Correct direction
 * - Minimum GPS samples
 * - Speed within acceptable range
 */

import { getSgeConfig } from "./config";
import { bearing, extractCoords, haversineDistance } from "./geo-math";
import type { RouteAssignment, RouteSegment } from "./types";

export interface SegmentContext {
  segments: RouteSegment[];
  currentSegmentIndex: number;
  totalLengthMetres: number;
}

export function createSegments(assignment: RouteAssignment): SegmentContext {
  const cfg = getSgeConfig().segment;
  const coords = extractCoords(assignment.geometry);
  const segments: RouteSegment[] = [];

  let segStart = 0;
  let accumulated = 0;
  let segId = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [aLon, aLat] = coords[i];
    const [bLon, bLat] = coords[i + 1];
    const dist = haversineDistance(aLat, aLon, bLat, bLon);
    accumulated += dist;

    if (accumulated >= cfg.defaultLengthMetres || i === coords.length - 2) {
      const [sLon, sLat] = coords[segStart];
      const [eLon, eLat] = coords[i + 1];
      segments.push({
        id: `seg-${segId}`,
        index: segId,
        startCoord: [sLon, sLat],
        endCoord: [eLon, eLat],
        lengthMetres: accumulated,
        bearing: bearing(sLat, sLon, eLat, eLon),
        completed: false,
        gpsSamples: 0,
      });
      segId++;
      segStart = i + 1;
      accumulated = 0;
    }
  }

  const totalLengthMetres = segments.reduce((sum, s) => sum + s.lengthMetres, 0);

  return {
    segments,
    currentSegmentIndex: 0,
    totalLengthMetres,
  };
}

export interface SegmentUpdateInput {
  nearestSegmentIndex: number;
  distanceFromRoute: number;
  speed: number;
  headingCorrect: boolean;
  gpsAccuracy: number;
}

export interface SegmentUpdateResult {
  updatedCtx: SegmentContext;
  segmentJustCompleted: boolean;
  completedLengthMetres: number;
  remainingLengthMetres: number;
}

export function updateSegments(
  ctx: SegmentContext,
  input: SegmentUpdateInput
): SegmentUpdateResult {
  const cfg = getSgeConfig();
  const { segment: segCfg, corridor: corrCfg } = cfg;
  const { nearestSegmentIndex, distanceFromRoute, speed, headingCorrect, gpsAccuracy } = input;

  const updatedCtx: SegmentContext = {
    ...ctx,
    segments: ctx.segments.map((s) => ({ ...s })),
  };

  let segmentJustCompleted = false;

  // Map polyline segment index to our segment array index
  const segIdx = Math.min(nearestSegmentIndex, updatedCtx.segments.length - 1);
  const currentSeg = updatedCtx.segments[segIdx];

  if (
    currentSeg &&
    !currentSeg.completed &&
    distanceFromRoute <= corrCfg.onRouteMetres &&
    gpsAccuracy <= corrCfg.gpsUnreliableAccuracyMetres &&
    headingCorrect &&
    speed >= segCfg.minSpeedKmh &&
    speed <= segCfg.maxSpeedKmh
  ) {
    currentSeg.gpsSamples++;
    if (currentSeg.gpsSamples >= segCfg.minGpsSamples) {
      currentSeg.completed = true;
      segmentJustCompleted = true;
    }
  }

  updatedCtx.currentSegmentIndex = segIdx;

  const completedLengthMetres = updatedCtx.segments
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.lengthMetres, 0);

  const remainingLengthMetres = updatedCtx.totalLengthMetres - completedLengthMetres;

  return {
    updatedCtx,
    segmentJustCompleted,
    completedLengthMetres,
    remainingLengthMetres,
  };
}
