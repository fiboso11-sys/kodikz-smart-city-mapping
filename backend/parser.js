/**
 * Teltonika Codec 8 parsing via `teltonika-parser` npm package.
 * TCP flow: IMEI packet → ACK 0x01 → AVL packet → ACK (4-byte record count).
 */

const TeltonikaParser = require("teltonika-parser");
const { extractTelemetryFromRecord } = require("./lib/teltonika-telemetry");

const MAX_IMEI_FRAME_BYTES = 2 + 20;

/** Teltonika AVL TCP packet size from preamble + data field length + CRC. */
function getAvlPacketLength(buffer) {
  if (buffer.length < 12) return null;
  if (buffer.length < 4) return null;
  if (buffer.readUInt32BE(0) !== 0) return null;
  const dataFieldLength = buffer.readUInt32BE(4);
  if (dataFieldLength < 8 || dataFieldLength > 128000) return null;
  return 4 + 4 + dataFieldLength + 4;
}

/**
 * First message on TCP connection: 2-byte IMEI length + IMEI ASCII.
 * @returns {{ status: 'need_more' } | { status: 'reject', reason: string } | { status: 'ok', imei: string, consumed: number }}
 */
function tryParseImeiHandshake(buffer) {
  if (buffer.length < 2) {
    return { status: "need_more" };
  }

  if (buffer.length >= 4 && buffer.readUInt32BE(0) === 0) {
    return { status: "reject", reason: "AVL preamble received before IMEI handshake" };
  }

  const imeiLength = buffer.readUInt16BE(0);

  if (imeiLength < 8 || imeiLength > 20) {
    return { status: "reject", reason: `Invalid IMEI length: ${imeiLength}` };
  }

  const frameSize = 2 + imeiLength;
  if (buffer.length < frameSize) {
    return { status: "need_more" };
  }

  const imei = buffer.slice(2, frameSize).toString("ascii").trim();
  if (!/^\d{8,20}$/.test(imei)) {
    return { status: "reject", reason: "IMEI must be 8–20 ASCII digits" };
  }

  return { status: "ok", imei, consumed: frameSize };
}

/** True when buffer cannot be a valid IMEI handshake and should be closed. */
function isHandshakeBufferExhausted(buffer) {
  if (buffer.length <= MAX_IMEI_FRAME_BYTES) return false;
  const result = tryParseImeiHandshake(buffer);
  return result.status === "need_more";
}

/**
 * Decode one full AVL buffer and extract normalized GPS rows.
 * @param {Buffer} packet
 * @param {string} imei
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
    const telemetry = extractTelemetryFromRecord(rec);
    const speed = rec.gps?.speed ?? 0;
    return {
      imei,
      latitude: rec.gps?.latitude ?? 0,
      longitude: rec.gps?.longitude ?? 0,
      speed,
      heading: rec.gps?.angle ?? 0,
      timestamp: (rec.timestamp instanceof Date ? rec.timestamp : new Date()).toISOString(),
      ignition: telemetry.ignition ?? (speed > 2 ? true : null),
      batteryVoltage: telemetry.batteryVoltage,
      externalPower: telemetry.externalPower,
      gsmSignal: telemetry.gsmSignal,
      satellites: telemetry.satellites,
    };
  });

  return { points, ackCount, consumed: packet.length };
}

/** Build 4-byte big-endian ACK with number of accepted AVL records. */
function buildAvlAck(recordCount) {
  const ack = Buffer.alloc(4);
  ack.writeUInt32BE(recordCount, 0);
  return ack;
}

/** IMEI login ACK — single byte 0x01. */
const IMEI_ACK = Buffer.from([0x01]);

module.exports = {
  getAvlPacketLength,
  tryParseImeiHandshake,
  isHandshakeBufferExhausted,
  parseAvlPacket,
  buildAvlAck,
  IMEI_ACK,
  MAX_IMEI_FRAME_BYTES,
};
