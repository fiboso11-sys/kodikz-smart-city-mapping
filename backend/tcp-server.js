/**
 * TCP server for Teltonika FMM130 (and compatible) devices — Codec 8 on TCP_PORT (default 5000).
 * Exposed directly on the VPS firewall (not proxied through Nginx).
 */

const net = require("net");
const config = require("./config");
const store = require("./store");
const runtime = require("./runtime");
const {
  getAvlPacketLength,
  tryParseImeiHandshake,
  isHandshakeBufferExhausted,
  parseAvlPacket,
  buildAvlAck,
  IMEI_ACK,
} = require("./parser");

/**
 * @param {import('net').Socket} socket
 * @param {string} reason
 */
function disconnectClient(socket, reason) {
  console.warn(`[TCP] Disconnecting ${socket.remoteAddress}: ${reason}`);
  socket.destroy();
}

/**
 * @param {Buffer} current
 * @param {Buffer} chunk
 * @param {number} maxBytes
 * @returns {Buffer | null} null if over limit
 */
function appendBuffer(current, chunk, maxBytes) {
  if (current.length + chunk.length > maxBytes) return null;
  return Buffer.concat([current, chunk]);
}

/**
 * Process incoming bytes per socket (handles split TCP frames).
 * @param {import('net').Socket} socket
 */
function attachSocketHandlers(socket) {
  let imei = null;
  let buffer = Buffer.alloc(0);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let handshakeTimer = null;

  const clearHandshakeTimer = () => {
    if (handshakeTimer) {
      clearTimeout(handshakeTimer);
      handshakeTimer = null;
    }
  };

  const startHandshakeTimer = () => {
    clearHandshakeTimer();
    handshakeTimer = setTimeout(() => {
      if (!imei) {
        disconnectClient(socket, `IMEI handshake timeout (${config.tcpHandshakeTimeoutMs}ms)`);
      }
    }, config.tcpHandshakeTimeoutMs);
  };

  startHandshakeTimer();

  socket.on("data", (chunk) => {
    const next = appendBuffer(buffer, chunk, config.tcpMaxBufferBytes);
    if (!next) {
      disconnectClient(socket, `Buffer exceeded ${config.tcpMaxBufferBytes} bytes`);
      return;
    }
    buffer = next;

    while (buffer.length > 0) {
      if (!imei) {
        if (isHandshakeBufferExhausted(buffer)) {
          disconnectClient(socket, "Malformed IMEI handshake (frame too large)");
          return;
        }

        const handshake = tryParseImeiHandshake(buffer);
        if (handshake.status === "need_more") break;
        if (handshake.status === "reject") {
          disconnectClient(socket, handshake.reason);
          return;
        }

        imei = handshake.imei;
        buffer = buffer.subarray(handshake.consumed);
        clearHandshakeTimer();
        socket.write(IMEI_ACK);
        console.log(`[TCP] IMEI registered: ${imei} from ${socket.remoteAddress}`);
        continue;
      }

      const packetLength = getAvlPacketLength(buffer);
      if (!packetLength) break;
      if (buffer.length < packetLength) break;

      const packet = buffer.subarray(0, packetLength);
      buffer = buffer.subarray(packetLength);

      try {
        const { points, ackCount } = parseAvlPacket(packet, imei);
        for (const point of points) {
          store.upsert(point);
        }
        if (points.length > 0) {
          const last = points[points.length - 1];
          console.log(
            `[TCP] ${imei} · ${points.length} record(s) · ${last.latitude.toFixed(5)},${last.longitude.toFixed(5)} · ${last.speed} km/h`
          );
        }
        socket.write(buildAvlAck(ackCount));
      } catch (err) {
        console.error(`[TCP] Parse error (${imei}):`, err.message);
        buffer = Buffer.alloc(0);
        break;
      }
    }
  });

  socket.on("error", (err) => {
    console.error(`[TCP] Socket error (${imei ?? "unknown"}):`, err.message);
  });

  socket.on("close", () => {
    clearHandshakeTimer();
    console.log(`[TCP] Disconnected: ${imei ?? socket.remoteAddress}`);
  });
}

function startTcpServer() {
  const server = net.createServer(attachSocketHandlers);

  server.on("error", (err) => {
    console.error("[TCP] Server error:", err);
    process.exit(1);
  });

  server.listen(config.tcpPort, config.host, () => {
    runtime.setTcpListening(true);
    console.log(`[TCP] Teltonika listener on ${config.host}:${config.tcpPort}`);
    console.log(
      `[TCP] Handshake timeout ${config.tcpHandshakeTimeoutMs}ms · max buffer ${config.tcpMaxBufferBytes} bytes`
    );
  });

  return server;
}

module.exports = { startTcpServer };
