/**
 * Survey Guidance Engine — Corridor Engine
 *
 * Computes the vehicle's distance from its assigned route corridor
 * and determines corridor zone classification.
 */

import { getSgeConfig } from "./config";
import {
  extractCoords,
  pointToPolylineDistance,
} from "./geo-math";
import type { RouteAssignment } from "./types";

export type CorridorZone = "ON_ROUTE" | "WARNING" | "OFF_ROUTE";

export interface CorridorResult {
  distanceMetres: number;
  zone: CorridorZone;
  nearestSegmentIndex: number;
}

export function computeCorridorPosition(
  lat: number,
  lon: number,
  assignment: RouteAssignment
): CorridorResult {
  const cfg = getSgeConfig().corridor;
  const coords = extractCoords(assignment.geometry);

  if (coords.length < 2) {
    return { distanceMetres: 0, zone: "ON_ROUTE", nearestSegmentIndex: 0 };
  }

  const { distance, segmentIndex } = pointToPolylineDistance(lat, lon, coords);

  let zone: CorridorZone;
  if (distance <= cfg.onRouteMetres) {
    zone = "ON_ROUTE";
  } else if (distance <= cfg.warningMetres) {
    zone = "WARNING";
  } else {
    zone = "OFF_ROUTE";
  }

  return {
    distanceMetres: distance,
    zone,
    nearestSegmentIndex: segmentIndex,
  };
}
