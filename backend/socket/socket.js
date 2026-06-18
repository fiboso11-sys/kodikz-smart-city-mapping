const { Server } = require("socket.io");
const config = require("../config");
const log = require("../services/logger");

function parseSocketCors() {
  const raw = config.corsOrigin.trim();
  if (raw === "*" || raw === "") return { origin: true, credentials: true };
  const origins = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return { origin: origins, credentials: true };
}

/**
 * @param {import('http').Server} httpServer
 */
function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    path: config.socketPath,
    cors: parseSocketCors(),
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    log.info("socket", "Client connected", { id: socket.id });
    socket.on("disconnect", () => {
      log.info("socket", "Client disconnected", { id: socket.id });
    });
  });

  log.info("socket", "Ready", { path: config.socketPath, event: "location_update" });
  return io;
}

module.exports = { attachSocket };
