import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "../public/data");
mkdirSync(out, { recursive: true });

const CENTER = { lng: 55.2708, lat: 25.2048 };
const TYPES = ["SUV", "Pickup", "Van", "Truck", "Municipality Vehicle"];
const FIRST = ["Ahmed", "Mohammed", "Omar", "Khalid", "Sara", "Fatima", "Ali", "Hassan"];
const LAST = ["Al Rashid", "Khan", "Patel", "Nasser", "Ibrahim", "Saleh"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const companies = Array.from({ length: 50 }, (_, i) => ({
  id: `co-${String(i + 1).padStart(3, "0")}`,
  name: `Dubai Fleet Co ${String(i + 1).padStart(3, "0")}`,
  tradeLicense: `TL-${10000 + i}`,
  contactEmail: `fleet${i + 1}@demo.kodikz.ae`,
  status: "active",
}));

const permits = Array.from({ length: 100 }, (_, i) => ({
  id: `prm-${String(i + 1).padStart(4, "0")}`,
  code: `PRM-2024-${String(i + 1).padStart(4, "0")}`,
  companyId: pick(companies).id,
  validFrom: "2024-01-01",
  validTo: "2026-12-31",
  status: "active",
}));

/** Grid-style paths (orthogonal segments) — align visually with road tiles. */
function roadGridPath(steps = 14) {
  let lng = CENTER.lng + rand(-0.05, 0.05);
  let lat = CENTER.lat + rand(-0.04, 0.04);
  const pts = [[lng, lat]];
  for (let i = 1; i < steps; i++) {
    const seg = rand(0.014, 0.03);
    if (i % 2 === 1) lng += (Math.random() > 0.5 ? 1 : -1) * seg;
    else lat += (Math.random() > 0.5 ? 1 : -1) * seg;
    lng = Math.max(54.95, Math.min(55.5, lng));
    lat = Math.max(24.98, Math.min(25.32, lat));
    pts.push([lng, lat]);
  }
  return pts;
}

const VEHICLE_COUNT = 60;
const routes = Array.from({ length: VEHICLE_COUNT }, (_, i) => {
  const co = companies[i % companies.length];
  return {
    id: `rt-${String(i + 1).padStart(4, "0")}`,
    name: `Fleet route ${i + 1}`,
    companyId: co.id,
    permitId: Math.random() > 0.4 ? pick(permits).id : null,
    vehicleId: `vh-${String(i + 1).padStart(3, "0")}`,
    color: "#2563eb",
    geometry: { type: "LineString", coordinates: roadGridPath(12 + (i % 4)) },
  };
});

const vehicles = Array.from({ length: VEHICLE_COUNT }, (_, i) => {
  const co = companies[i % companies.length];
  const route = routes[i];
  const wp = route.geometry.coordinates;
  const progress = rand(0.1, 0.85);
  const [lng, lat] = pointAlongRoute(wp, progress);
  const [lng2, lat2] = pointAlongRoute(wp, Math.min(1, progress + 0.02));
  return {
    id: `vh-${String(i + 1).padStart(3, "0")}`,
    plateNumber: `DXB-${rand(10000, 99999).toFixed(0)}`,
    companyId: co.id,
    vehicleType: pick(TYPES),
    driverName: `${pick(FIRST)} ${pick(LAST)}`,
    permitId: (() => {
      const pool = permits.filter((p) => p.companyId === co.id);
      return pool.length ? pick(pool).id : null;
    })(),
    assignedRouteId: route.id,
    status: pick(["active", "active", "active", "idle", "offline"]),
    imei: null,
    latitude: lat,
    longitude: lng,
    speed: rand(25, 55),
    heading: bearingDeg(lat, lng, lat2, lng2),
    ignition: Math.random() > 0.05,
    lastUpdate: new Date().toISOString(),
    routeProgress: progress,
    waypointIndex: 1,
    targetLat: lat2,
    targetLng: lng2,
  };
});

function pointAlongRoute(coords, progress) {
  if (!coords.length) return [55.27, 25.2];
  if (coords.length === 1) return coords[0];
  const total = coords.length - 1;
  const idx = Math.min(Math.floor(progress * total), total - 1);
  const frac = progress * total - idx;
  const a = coords[idx];
  const b = coords[idx + 1];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

function bearingDeg(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const history = [];
const base = Date.now() - 7 * 24 * 3600 * 1000;
const span = 7 * 24 * 3600 * 1000;
const pointsPerVehicle = 35;

vehicles.forEach((v, vi) => {
  const route = routes.find((r) => r.id === v.assignedRouteId);
  const coords = route.geometry.coordinates;
  for (let i = 0; i < pointsPerVehicle; i++) {
    const progress = i / (pointsPerVehicle - 1 || 1);
    const [lng, lat] = pointAlongRoute(coords, progress);
    const ts = base + ((vi * pointsPerVehicle + i) / (vehicles.length * pointsPerVehicle)) * span;
    history.push({
      vehicleId: v.id,
      latitude: lat,
      longitude: lng,
      speed: 25 + rand(0, 35),
      heading: (() => {
        const [lng2, lat2] = pointAlongRoute(coords, Math.min(1, progress + 0.01));
        return bearingDeg(lat, lng, lat2, lng2);
      })(),
      ignition: true,
      timestamp: new Date(ts).toISOString(),
    });
  }
});
history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

writeFileSync(join(out, "companies.json"), JSON.stringify(companies, null, 2));
writeFileSync(join(out, "permits.json"), JSON.stringify(permits, null, 2));
writeFileSync(join(out, "routes.json"), JSON.stringify(routes, null, 2));
writeFileSync(join(out, "vehicles.json"), JSON.stringify(vehicles, null, 2));
writeFileSync(join(out, "violations.json"), JSON.stringify([], null, 2));
writeFileSync(join(out, "history.json"), JSON.stringify(history, null, 2));
console.log(`Seed: ${routes.length} routes, ${vehicles.length} vehicles, ${history.length} history points`);
