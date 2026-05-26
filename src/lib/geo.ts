import type { Vehicle, Route } from "@/types";

export const DUBAI = {
  center: { lng: 55.2708, lat: 25.2048 },
  zoom: 12,
  minLng: 54.95,
  maxLng: 55.5,
  minLat: 24.98,
  maxLat: 25.32,
};

export function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function routeLengthKm(route: Route): number {
  const coords = route.geometry.coordinates;
  let d = 0;
  for (let i = 1; i < coords.length; i++) {
    d += haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  return Math.max(d, 0.05);
}

export function progressForFrame(frameIndex: number, frameCount: number): number {
  if (frameCount <= 1) return 0;
  return frameIndex / (frameCount - 1);
}

/** Polyline from route start up to progress (for replay trail). */
export function trailToProgress(route: Route, progress: number): GeoJSON.LineString {
  const coords = route.geometry.coordinates;
  if (coords.length === 0) {
    return { type: "LineString", coordinates: [[DUBAI.center.lng, DUBAI.center.lat]] };
  }
  if (coords.length === 1) {
    return { type: "LineString", coordinates: coords };
  }
  const t = Math.max(0, Math.min(1, progress));
  const total = coords.length - 1;
  const idx = Math.min(Math.floor(t * total), total - 1);
  const frac = t * total - idx;
  const part = coords.slice(0, idx + 1);
  const a = coords[idx];
  const b = coords[idx + 1];
  part.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
  return { type: "LineString", coordinates: part };
}

export function snapToRoute(route: Route, progress: number) {
  const pos = pointOnRoute(route, progress);
  const ahead = pointOnRoute(route, Math.min(1, progress + 0.004));
  return {
    latitude: pos.lat,
    longitude: pos.lng,
    heading: bearing(pos.lat, pos.lng, ahead.lat, ahead.lng),
    routeProgress: progress,
  };
}

export function pointOnRoute(route: Route, progress: number): { lat: number; lng: number } {
  const coords = route.geometry.coordinates;
  if (coords.length === 0) return DUBAI.center;
  if (coords.length === 1) return { lng: coords[0][0], lat: coords[0][1] };
  const t = Math.max(0, Math.min(1, progress));
  const total = coords.length - 1;
  const idx = Math.min(Math.floor(t * total), total - 1);
  const frac = t * total - idx;
  const a = coords[idx];
  const b = coords[idx + 1];
  return { lng: a[0] + (b[0] - a[0]) * frac, lat: a[1] + (b[1] - a[1]) * frac };
}

export function distanceToRouteMeters(lng: number, lat: number, route: Route): number {
  const coords = route.geometry.coordinates;
  let min = Infinity;
  for (let i = 1; i < coords.length; i++) {
    const d = pointToSegmentMeters(lat, lng, coords[i - 1], coords[i]);
    if (d < min) min = d;
  }
  return min;
}

function pointToSegmentMeters(
  lat: number,
  lng: number,
  a: number[],
  b: number[]
): number {
  return haversineKm(lat, lng, a[1], a[0]) * 1000;
}

export interface ClusterPoint {
  id: string;
  lat: number;
  lng: number;
}

export function clusterPoints(points: ClusterPoint[], zoom: number) {
  const cell = Math.max(0.002, 0.05 / Math.pow(2, zoom - 8));
  const grid = new Map<string, ClusterPoint[]>();
  for (const p of points) {
    const key = `${Math.floor(p.lng / cell)},${Math.floor(p.lat / cell)}`;
    const cellPts = grid.get(key) ?? [];
    cellPts.push(p);
    grid.set(key, cellPts);
  }
  const clusters: Array<{ lat: number; lng: number; count: number; ids: string[] }> = [];
  const singles: ClusterPoint[] = [];
  for (const pts of grid.values()) {
    if (pts.length >= 4) {
      clusters.push({
        lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
        lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
        count: pts.length,
        ids: pts.map((p) => p.id),
      });
    } else singles.push(...pts);
  }
  return { clusters, singles };
}

/** Move only along assigned route polyline (stays on road layer). */
export function tickVehicle(v: Vehicle, route: Route | undefined): Vehicle {
  const updated = { ...v };

  if (!updated.ignition && Math.random() < 0.015) {
    updated.ignition = true;
    updated.speed = 25 + Math.random() * 35;
  } else if (updated.ignition && Math.random() < 0.006) {
    updated.ignition = false;
    updated.speed = 0;
  }

  if (!updated.ignition || !route) {
    updated.speed = 0;
    updated.status = "idle";
    updated.idleTicks = (updated.idleTicks ?? 0) + 1;
    updated.lastUpdate = new Date().toISOString();
    return updated;
  }

  updated.speed = Math.max(8, Math.min(70, updated.speed + (Math.random() - 0.5) * 4));
  const lenKm = routeLengthKm(route);
  const progressStep = ((updated.speed / 3600) * 3) / lenKm;
  let progress = updated.routeProgress + progressStep;
  if (progress >= 1) progress -= 1;

  const pos = pointOnRoute(route, progress);
  const lookAhead = pointOnRoute(route, (progress + 0.003) % 1);

  updated.latitude = pos.lat;
  updated.longitude = pos.lng;
  updated.heading = bearing(pos.lat, pos.lng, lookAhead.lat, lookAhead.lng);
  updated.routeProgress = progress;
  updated.targetLat = lookAhead.lat;
  updated.targetLng = lookAhead.lng;
  updated.status = updated.speed < 5 ? "idle" : "active";
  updated.idleTicks = updated.speed < 5 ? (updated.idleTicks ?? 0) + 1 : 0;
  updated.lastUpdate = new Date().toISOString();
  return updated;
}
