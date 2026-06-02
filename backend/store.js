/**
 * In-memory latest GPS position per device IMEI.
 * Replace with Redis/Postgres when scaling beyond a single VPS.
 */

/** @type {Map<string, object>} */
const latestByImei = new Map();

/**
 * @param {object | null | undefined} prev
 * @param {object} record
 * @param {string} key
 */
function pickTelemetry(prev, record, key) {
  if (record[key] !== undefined) return record[key];
  if (prev && prev[key] !== undefined) return prev[key];
  return null;
}

/**
 * @param {object} record
 */
function normalizeRecord(record) {
  const imei = String(record.imei);
  const prev = latestByImei.get(imei);

  return {
    imei,
    latitude: record.latitude,
    longitude: record.longitude,
    speed: record.speed,
    timestamp: record.timestamp,
    heading: record.heading ?? prev?.heading ?? 0,
    ignition: pickTelemetry(prev, record, "ignition"),
    batteryVoltage: pickTelemetry(prev, record, "batteryVoltage"),
    externalPower: pickTelemetry(prev, record, "externalPower"),
    gsmSignal: pickTelemetry(prev, record, "gsmSignal"),
    satellites: pickTelemetry(prev, record, "satellites"),
    receivedAt: new Date().toISOString(),
  };
}

/**
 * @param {object} record
 * @param {string} record.imei
 * @param {number} record.latitude
 * @param {number} record.longitude
 * @param {number} record.speed
 * @param {string} record.timestamp ISO-8601
 * @param {number} [record.heading]
 * @param {boolean|null} [record.ignition]
 * @param {number|null} [record.batteryVoltage] volts
 * @param {boolean|null} [record.externalPower]
 * @param {number|null} [record.gsmSignal] 0–5
 * @param {number|null} [record.satellites]
 */
function upsert(record) {
  latestByImei.set(String(record.imei), normalizeRecord(record));
}

/** @param {string} [imei] */
function getLatest(imei) {
  if (imei) return latestByImei.get(String(imei)) ?? null;
  let best = null;
  for (const row of latestByImei.values()) {
    if (!best || row.timestamp > best.timestamp) best = row;
  }
  return best;
}

function getAll() {
  return Array.from(latestByImei.values());
}

function count() {
  return latestByImei.size;
}

/** ISO-8601 of most recent server receive, or null if empty. */
function getLastPacketReceivedAt() {
  let best = null;
  for (const row of latestByImei.values()) {
    if (!best || row.receivedAt > best) best = row.receivedAt;
  }
  return best;
}

/** Devices with receivedAt within the last `withinMs` milliseconds. */
function countReporting(withinMs = 15_000) {
  const cutoff = Date.now() - withinMs;
  let n = 0;
  for (const row of latestByImei.values()) {
    if (new Date(row.receivedAt).getTime() >= cutoff) n += 1;
  }
  return n;
}

module.exports = {
  upsert,
  getLatest,
  getAll,
  count,
  getLastPacketReceivedAt,
  countReporting,
};
