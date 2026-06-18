const config = require("../config");
const log = require("./logger");
const { isMongoConnected } = require("../config/db");
const { LocationLatest, LocationHistory } = require("../models/Location");

/** @type {Map<string, object>} */
const latestByImei = new Map();

/** @type {import('socket.io').Server | null} */
let io = null;

function setSocketServer(socketIo) {
  io = socketIo;
}

function normalizeRecord(record) {
  const imei = String(record.imei);
  const prev = latestByImei.get(imei);

  return {
    imei,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    speed: Number(record.speed ?? 0),
    timestamp: record.timestamp,
    heading: record.heading ?? prev?.heading ?? 0,
    ignition: record.ignition ?? prev?.ignition ?? null,
    batteryVoltage: record.batteryVoltage ?? prev?.batteryVoltage ?? null,
    externalPower: record.externalPower ?? prev?.externalPower ?? null,
    gsmSignal: record.gsmSignal ?? prev?.gsmSignal ?? null,
    satellites: record.satellites ?? prev?.satellites ?? null,
    receivedAt: new Date().toISOString(),
  };
}

function emitLocationUpdate(row) {
  if (io) io.emit("location_update", row);
}

async function persistMongo(row) {
  if (!isMongoConnected()) return;
  await Promise.all([
    LocationLatest.findOneAndUpdate({ imei: row.imei }, row, { upsert: true, new: true }),
    LocationHistory.create(row),
  ]);
}

async function upsert(record) {
  const row = normalizeRecord(record);
  latestByImei.set(row.imei, row);
  emitLocationUpdate(row);

  try {
    await persistMongo(row);
  } catch (err) {
    log.error("store", "Mongo write failed", { imei: row.imei, error: err.message });
  }

  return row;
}

function getLatest(imei) {
  if (imei) return latestByImei.get(String(imei)) ?? null;
  return null;
}

function getAll() {
  return Array.from(latestByImei.values());
}

function count() {
  return latestByImei.size;
}

function getLastPacketReceivedAt() {
  let best = null;
  for (const row of latestByImei.values()) {
    if (!best || row.receivedAt > best) best = row.receivedAt;
  }
  return best;
}

function countReporting(withinMs = 15_000) {
  const cutoff = Date.now() - withinMs;
  let n = 0;
  for (const row of latestByImei.values()) {
    if (new Date(row.receivedAt).getTime() >= cutoff) n += 1;
  }
  return n;
}

async function getHistory(imei, options = {}) {
  const limit = Math.min(
    Math.max(1, Number(options.limit) || config.historyDefaultLimit),
    config.historyMaxLimit
  );

  if (isMongoConnected()) {
    const query = { imei: String(imei) };
    const points = await LocationHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    return points.reverse();
  }

  const row = latestByImei.get(String(imei));
  return row ? [row] : [];
}

async function hydrateFromMongo() {
  if (!isMongoConnected()) return 0;
  const docs = await LocationLatest.find({}).lean();
  for (const doc of docs) {
    const { _id, ...row } = doc;
    latestByImei.set(row.imei, row);
  }
  log.info("store", "Hydrated from MongoDB", { count: docs.length });
  return docs.length;
}

module.exports = {
  setSocketServer,
  upsert,
  getLatest,
  getAll,
  count,
  getLastPacketReceivedAt,
  countReporting,
  getHistory,
  hydrateFromMongo,
};
