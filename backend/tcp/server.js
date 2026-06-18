const net = require("net");
const config = require("../config");
const locationStore = require("../services/locationStore");
const runtime = require("../services/runtime");
const log = require("../services/logger");
const parser = require("../services/parser");

function disconnectClient(socket, reason) {
  log.warn("TCP", "Disconnect", { remote: socket.remoteAddress, reason });
  socket.destroy();
}

function appendBuffer(current, chunk, maxBytes) {
  if (current.length + chunk.length > maxBytes) return null;
  return Buffer.concat([current, chunk]);
}

function attachSocketHandlers(socket) {
  let imei = null;
  let buffer = Buffer.alloc(0);
  let handshakeTimer = null;

  const clearHandshakeTimer = () => {
    if (handshakeTimer) {
      clearTimeout(handshakeTimer);
      handshakeTimer = null;
    }
  };

  handshakeTimer = setTimeout(() => {
    if (!imei) {
      disconnectClient(socket, `IMEI timeout ${config.tcpHandshakeTimeoutMs}ms`);
    }
  }, config.tcpHandshakeTimeoutMs);

  socket.on("data", (chunk) => {
    try {
      const next = appendBuffer(buffer, chunk, config.tcpMaxBufferBytes);
      if (!next) {
        disconnectClient(socket, "Buffer limit exceeded");
        return;
      }
      buffer = next;

      while (buffer.length > 0) {
        if (!imei) {
          if (parser.isHandshakeBufferExhausted(buffer)) {
            disconnectClient(socket, "Malformed IMEI frame");
            return;
          }

          const handshake = parser.tryParseImeiHandshake(buffer);
          if (handshake.status === "need_more") break;
          if (handshake.status === "reject") {
            disconnectClient(socket, handshake.reason);
            return;
          }

          imei = handshake.imei;
          buffer = buffer.subarray(handshake.consumed);
          clearHandshakeTimer();
          socket.write(parser.IMEI_ACK);
          log.info("TCP", "IMEI received", { imei, remote: socket.remoteAddress });
          continue;
        }

        const packetLength = parser.getAvlPacketLength(buffer);
        if (!packetLength || buffer.length < packetLength) break;

        const packet = buffer.subarray(0, packetLength);
        buffer = buffer.subarray(packetLength);

        log.info("TCP", "Packet received", { imei, bytes: packet.length });

        let points;
        let ackCount;
        try {
          ({ points, ackCount } = parser.parseAvlPacket(packet, imei));
        } catch (parseErr) {
          log.error("TCP", "Parse failure", { imei, error: parseErr.message });
          buffer = Buffer.alloc(0);
          break;
        }

        for (const point of points) {
          void locationStore.upsert(point);
        }

        if (points.length > 0) {
          const last = points[points.length - 1];
          log.info("TCP", "Parse success", {
            imei,
            records: points.length,
            lat: last.latitude,
            lng: last.longitude,
            speed: last.speed,
          });
        }

        socket.write(parser.buildAvlAck(ackCount));
      }
    } catch (err) {
      log.error("TCP", "Handler error", { imei: imei ?? "unknown", error: err.message });
      buffer = Buffer.alloc(0);
    }
  });

  socket.on("error", (err) => {
    log.error("TCP", "Socket error", { imei: imei ?? "unknown", error: err.message });
  });

  socket.on("close", () => {
    clearHandshakeTimer();
    log.info("TCP", "Device disconnected", { imei: imei ?? socket.remoteAddress });
  });
}

function startTcpServer() {
  const server = net.createServer((socket) => {
    log.info("TCP", "Device connect", { remote: socket.remoteAddress });
    attachSocketHandlers(socket);
  });

  server.on("error", (err) => {
    log.error("TCP", "Server error", { error: err.message });
    process.exit(1);
  });

  server.listen(config.tcpPort, config.host, () => {
    runtime.setTcpListening(true);
    log.info("TCP", "Listening", { host: config.host, port: config.tcpPort });
  });

  return server;
}

module.exports = { startTcpServer };
