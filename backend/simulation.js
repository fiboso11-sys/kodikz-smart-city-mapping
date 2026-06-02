/**
 * Server-side GPS simulation — feeds the same store as Teltonika TCP.
 * Enabled with SIMULATION_MODE=true. API responses are identical to live data.
 */

const store = require("./store");
const config = require("./config");

/** Major Dubai corridors (lat, lng). */
const DUBAI_ROUTES = [
  {
    name: "Sheikh Zayed Rd",
    waypoints: [
      [25.0654, 55.1393],
      [25.085, 55.151],
      [25.108, 55.168],
      [25.128, 55.182],
      [25.154, 55.201],
      [25.178, 55.227],
      [25.196, 55.26],
      [25.204, 55.271],
    ],
  },
  {
    name: "Marina / JBR",
    waypoints: [
      [25.077, 55.134],
      [25.0805, 55.128],
      [25.084, 55.139],
      [25.081, 55.148],
      [25.076, 55.142],
      [25.077, 55.134],
    ],
  },
  {
    name: "Business Bay",
    waypoints: [
      [25.185, 55.265],
      [25.192, 55.275],
      [25.198, 55.288],
      [25.204, 55.271],
      [25.197, 55.26],
      [25.185, 55.265],
    ],
  },
  {
    name: "Deira Creek",
    waypoints: [
      [25.265, 55.307],
      [25.272, 55.318],
      [25.278, 55.332],
      [25.269, 55.34],
      [25.262, 55.328],
      [25.265, 55.307],
    ],
  },
];

const EARTH_RADIUS_M = 6_371_000;

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function bearingDeg(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function randomSpeedKmh() {
  return 22 + Math.random() * 34;
}

class SimulatedDevice {
  /**
   * @param {string} imei
   * @param {{ waypoints: number[][] }} route
   */
  constructor(imei, route) {
    this.imei = imei;
    this.waypoints = route.waypoints;
    this.segmentIndex = 0;
    this.segmentT = 0;
    this.speedKmh = randomSpeedKmh();
    this.idleTicks = 0;
  }

  /** @param {number} dtSec */
  tick(dtSec) {
    const from = this.waypoints[this.segmentIndex];
    const to = this.waypoints[(this.segmentIndex + 1) % this.waypoints.length];
    const segM = Math.max(haversineMeters(from[0], from[1], to[0], to[1]), 8);
    const advanceM = (this.speedKmh / 3.6) * dtSec;

    if (Math.random() < 0.04) {
      this.idleTicks = 2;
      this.speedKmh = 0;
    }

    if (this.idleTicks > 0) {
      this.idleTicks -= 1;
      if (this.idleTicks === 0) this.speedKmh = randomSpeedKmh();
    } else if (Math.random() < 0.12) {
      this.speedKmh = Math.min(58, Math.max(18, this.speedKmh + (Math.random() - 0.5) * 12));
    }

    const moveT = this.speedKmh > 1 ? advanceM / segM : 0;
    this.segmentT += moveT;

    while (this.segmentT >= 1) {
      this.segmentT -= 1;
      this.segmentIndex = (this.segmentIndex + 1) % this.waypoints.length;
      if (Math.random() < 0.25) this.speedKmh = randomSpeedKmh();
    }

    const lat = from[0] + (to[0] - from[0]) * this.segmentT;
    const lng = from[1] + (to[1] - from[1]) * this.segmentT;
    const heading = bearingDeg(from[0], from[1], to[0], to[1]);

    const ignitionOn = this.speedKmh > 3;
    store.upsert({
      imei: this.imei,
      latitude: lat,
      longitude: lng,
      speed: Math.round(this.speedKmh * 10) / 10,
      heading: Math.round(heading * 10) / 10,
      ignition: ignitionOn,
      batteryVoltage: ignitionOn ? 13.2 + Math.random() * 0.6 : 12.1 + Math.random() * 0.4,
      externalPower: ignitionOn,
      gsmSignal: 2 + Math.floor(Math.random() * 4),
      satellites: 8 + Math.floor(Math.random() * 10),
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * @returns {{ stop: () => void }}
 */
function startSimulation() {
  const intervalMs = config.simulationIntervalMs;
  const dtSec = intervalMs / 1000;
  const imeis = config.simulationImeis;

  const devices = imeis.map(
    (imei, i) => new SimulatedDevice(imei, DUBAI_ROUTES[i % DUBAI_ROUTES.length])
  );

  for (const device of devices) {
    device.tick(0);
  }

  console.log(
    `[SIM] ${devices.length} device(s) · ${intervalMs}ms tick · IMEIs: ${imeis.join(", ")}`
  );

  const timer = setInterval(() => {
    for (const device of devices) {
      device.tick(dtSec);
    }
  }, intervalMs);

  timer.unref?.();

  return {
    stop: () => clearInterval(timer),
  };
}

module.exports = { startSimulation, DUBAI_ROUTES };
