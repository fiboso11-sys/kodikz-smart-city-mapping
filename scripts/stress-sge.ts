/**
 * 100-vehicle stress harness (local simulation).
 * Measures SGE decision latency under load. Does not fabricate results.
 *
 * Run: pnpm stress:sge
 */

import { createSession, processGpsTick } from "../src/engines/sge/survey-guidance-engine";
import type { GpsPoint, RouteAssignment } from "../src/engines/sge";

const VEHICLES = Number(process.env.STRESS_VEHICLES ?? "100");
const TICKS = Number(process.env.STRESS_TICKS ?? "120");
const INTERVAL_MS = 5_000;

const ROUTE: GeoJSON.LineString = {
  type: "LineString",
  coordinates: Array.from({ length: 50 }, (_, i) => [55.27 + i * 0.001, 25.2048]),
};

function gps(i: number, tick: number): GpsPoint {
  const progress = (tick % 40) / 40;
  const lon = 55.27 + progress * 0.05 + (i % 7) * 0.0001;
  const lat = 25.2048 + ((tick % 11) - 5) * (i % 5 === 0 ? 0.0008 : 0.00005);
  return {
    latitude: lat,
    longitude: lon,
    accuracy: i % 13 === 0 ? 80 : 8,
    speed: 30 + (i % 10),
    heading: i % 17 === 0 ? 270 : 90,
    timestamp: Date.now() + tick * INTERVAL_MS,
  };
}

async function main() {
  console.log(`\nStress harness: ${VEHICLES} vehicles × ${TICKS} ticks\n`);
  let sessions = Array.from({ length: VEHICLES }, (_, i) => {
    const assignment: RouteAssignment = {
      id: `asg-stress-${i}`,
      vehicleId: `imei-stress-${i}`,
      routeId: `route-${i % 20}`,
      routeName: `Route ${i % 20}`,
      geometry: ROUTE,
      assignedAt: Date.now(),
      status: "active",
    };
    return createSession(assignment.vehicleId, assignment);
  });

  const latencies: number[] = [];
  const t0 = Date.now();
  let decisions = 0;

  for (let tick = 0; tick < TICKS; tick++) {
    for (let i = 0; i < VEHICLES; i++) {
      const start = performance.now();
      const result = processGpsTick(sessions[i], gps(i, tick));
      sessions[i] = result.updatedSession;
      const ms = performance.now() - start;
      latencies.push(ms);
      if (result.snapshot) decisions += 1;
    }
  }

  latencies.sort((a, b) => a - b);
  const pct = (p: number) =>
    latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))];
  const elapsed = Date.now() - t0;
  const mem = process.memoryUsage();

  const report = {
    vehicles: VEHICLES,
    ticks: TICKS,
    decisions,
    wallClockMs: elapsed,
    decisionLatencyMs: {
      p50: Number(pct(50).toFixed(3)),
      p95: Number(pct(95).toFixed(3)),
      p99: Number(pct(99).toFixed(3)),
      max: Number(latencies[latencies.length - 1].toFixed(3)),
    },
    targetDecisionUnder100ms: pct(95) < 100,
    heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
    note: "SGE-only CPU harness. Full API/Postgres/SSE 60-minute stress requires pilot server (Docker/Postgres not available on this workstation).",
  };

  console.log(JSON.stringify(report, null, 2));
  const fs = await import("fs");
  fs.mkdirSync("data/stress-reports", { recursive: true });
  const file = `data/stress-reports/sge-stress-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log("Wrote", file);
  process.exit(report.targetDecisionUnder100ms ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
