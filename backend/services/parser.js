/**
 * Teltonika Codec 8 parser — FMM130 AVL over TCP.
 * IMEI handshake → 0x01 ACK → AVL packets → 4-byte record-count ACK.
 */

const TeltonikaParser = require("teltonika-parser");

const MAX_IMEI_FRAME_BYTES = 2 + 20;
const IMEI_ACK = Buffer.from([0x01]);

const IO = {
  IGNITION: 239,
  BATTERY_VOLTAGE_MV: 67,
  EXTERNAL_VOLTAGE_MV: 66,
  GSM_SIGNAL: 21,
};

function ioMap(ioElements) {
  const map = new Map();
  for (const el of ioElements ?? []) {
    if (el && typeof el.id === "number") map.set(el.id, el.value);
  }
  return map;
}

function extractTelemetry(rec) {
  const io = ioMap(rec.ioElements);
  let ignition = null;
  if (io.has(IO.IGNITION)) ignition = io.get(IO.IGNITION) === 1;

  let batteryVoltage = null;
  if (io.has(IO.BATTERY_VOLTAGE_MV)) {
    batteryVoltage = Math.round((io.get(IO.BATTERY_VOLTAGE_MV) / 1000) * 100) / 100;
  }

  let externalPower = null;
  if (io.has(IO.EXTERNAL_VOLTAGE_MV)) {
    externalPower = io.get(IO.EXTERNAL_VOLTAGE_MV) >= 9000;
  }

  let gsmSignal = io.has(IO.GSM_SIGNAL) ? io.get(IO.GSM_SIGNAL) : null;
  let satellites =
    rec.gps?.satellites !== undefined && rec.gps?.satellites !== null
      ? Number(rec.gps.satellites)
      : null;

  return { ignition, batteryVoltage, externalPower, gsmSignal, satellites };
}

function getAvlPacketLength(buffer) {
  if (buffer.length < 12) return null;
  if (buffer.readUInt32BE(0) !== 0) return null;
  const dataFieldLength = buffer.readUInt32BE(4);
  if (dataFieldLength < 8 || dataFieldLength > 128000) return null;
  return 4 + 4 + dataFieldLength + 4;
}

function tryParseImeiHandshake(buffer) {
  if (buffer.length < 2) return { status: "need_more" };

  if (buffer.length >= 4 && buffer.readUInt32BE(0) === 0) {
    return { status: "reject", reason: "AVL preamble before IMEI handshake" };
  }

  const imeiLength = buffer.readUInt16BE(0);
  if (imeiLength < 8 || imeiLength > 20) {
    return { status: "reject", reason: `Invalid IMEI length: ${imeiLength}` };
  }

  const frameSize = 2 + imeiLength;
  if (buffer.length < frameSize) return { status: "need_more" };

  const imei = buffer.slice(2, frameSize).toString("ascii").trim();
  if (!/^\d{8,20}$/.test(imei)) {
    return { status: "reject", reason: "IMEI must be 8–20 digits" };
  }

  return { status: "ok", imei, consumed: frameSize };
}

function isHandshakeBufferExhausted(buffer) {
  if (buffer.length <= MAX_IMEI_FRAME_BYTES) return false;
  return tryParseImeiHandshake(buffer).status === "need_more";
}

/**
 * @param {Buffer} packet
 * @param {string} imei
 * @returns {{ points: object[], ackCount: number }}
 */
function parseAvlPacket(packet, imei) {
  const parser = new TeltonikaParser(packet);
  if (parser.isImei) {
    throw new Error("Expected AVL packet but received IMEI frame");
  }

  const avl = parser.getAvl();
  const records = avl.records ?? [];
  const ackCount = avl.number_of_data ?? records.length;

  const points = records.map((rec) => {
    const telemetry = extractTelemetry(rec);
    const speed = rec.gps?.speed ?? 0;
    const ts = rec.timestamp instanceof Date ? rec.timestamp : new Date();

    return {
      imei,
      latitude: rec.gps?.latitude ?? 0,
      longitude: rec.gps?.longitude ?? 0,
      speed,
      heading: rec.gps?.angle ?? 0,
      timestamp: ts.toISOString(),
      ignition: telemetry.ignition ?? (speed > 2 ? true : null),
      batteryVoltage: telemetry.batteryVoltage,
      externalPower: telemetry.externalPower,
      gsmSignal: telemetry.gsmSignal,
      satellites: telemetry.satellites,
    };
  });

  return { points, ackCount };
}

function buildAvlAck(recordCount) {
  const ack = Buffer.alloc(4);
  ack.writeUInt32BE(recordCount, 0);
  return ack;
}

module.exports = {
  getAvlPacketLength,
  tryParseImeiHandshake,
  isHandshakeBufferExhausted,
  parseAvlPacket,
  buildAvlAck,
  IMEI_ACK,
};
