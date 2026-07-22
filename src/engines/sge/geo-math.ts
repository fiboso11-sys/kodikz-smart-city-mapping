/**
 * Survey Guidance Engine — Geodetic Math Utilities
 *
 * Pure functions. No external dependencies (no Turf.js needed for these basics).
 * Uses Haversine formula for distance and bearing calculations.
 */

const R_EARTH = 6_371_000; // metres
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function toRad(deg: number): number {
  return deg * DEG2RAD;
}

export function toDeg(rad: number): number {
  return rad * RAD2DEG;
}

/** Haversine distance in metres between two WGS84 points. */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing from point A to point B in degrees [0, 360). */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

/** Absolute angular difference between two headings [0, 180]. */
export function headingDifference(h1: number, h2: number): number {
  let diff = Math.abs(((h1 - h2 + 180) % 360) - 180);
  if (diff < 0) diff += 360;
  return Math.min(diff, 360 - diff);
}

/**
 * Perpendicular (cross-track) distance from a point to a line segment, in metres.
 * Returns the minimum distance from the point to the nearest point on the segment.
 */
export function pointToSegmentDistance(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const dAP = haversineDistance(aLat, aLon, pLat, pLon);
  const dAB = haversineDistance(aLat, aLon, bLat, bLon);

  if (dAB < 0.001) return dAP; // degenerate segment

  const bearingAB = toRad(bearing(aLat, aLon, bLat, bLon));
  const bearingAP = toRad(bearing(aLat, aLon, pLat, pLon));

  const crossTrack = Math.asin(
    Math.sin(dAP / R_EARTH) * Math.sin(bearingAP - bearingAB)
  );
  const alongTrack =
    Math.acos(Math.cos(dAP / R_EARTH) / Math.cos(crossTrack)) * R_EARTH;

  if (alongTrack < 0) return dAP;
  if (alongTrack > dAB) return haversineDistance(bLat, bLon, pLat, pLon);

  return Math.abs(crossTrack * R_EARTH);
}

/**
 * Minimum distance from a point to a polyline (array of [lng, lat] pairs).
 * Also returns the index of the nearest segment.
 */
export function pointToPolylineDistance(
  lat: number,
  lon: number,
  coords: [number, number][]
): { distance: number; segmentIndex: number } {
  let minDist = Infinity;
  let segIdx = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [aLon, aLat] = coords[i];
    const [bLon, bLat] = coords[i + 1];
    const d = pointToSegmentDistance(lat, lon, aLat, aLon, bLat, bLon);
    if (d < minDist) {
      minDist = d;
      segIdx = i;
    }
  }

  return { distance: minDist, segmentIndex: segIdx };
}

/** Length of a polyline in metres. */
export function polylineLength(coords: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [aLon, aLat] = coords[i];
    const [bLon, bLat] = coords[i + 1];
    total += haversineDistance(aLat, aLon, bLat, bLon);
  }
  return total;
}

/** Extract coordinates from a GeoJSON LineString or MultiLineString as [lng, lat][]. */
export function extractCoords(
  geom: GeoJSON.LineString | GeoJSON.MultiLineString
): [number, number][] {
  if (geom.type === "LineString") {
    return geom.coordinates as [number, number][];
  }
  return geom.coordinates.flat() as [number, number][];
}
