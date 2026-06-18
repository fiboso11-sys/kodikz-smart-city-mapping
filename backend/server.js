/**
 * kodikz-gps-backend — production entry point
 * TCP :5000 (Teltonika FMM130 Codec 8) + HTTP :PORT (REST + Socket.IO)
 * Domain: api-kodikz.giantphoenixllc.com (Nginx TLS)
 */

const config = require("./config");
const { connectMongo, disconnectMongo } = require("./config/db");
const runtime = require("./services/runtime");
const locationStore = require("./services/locationStore");
const { startTcpServer } = require("./tcp/server");
const { createHttpServer } = require("./app");
const log = require("./services/logger");

log.info("startup", "kodikz-gps-backend", {
  domain: config.domain,
  api: `${config.apiHost}:${config.apiPort}`,
  tcp: `${config.host}:${config.tcpPort}`,
  mongo: config.mongoEnabled ? "enabled" : "memory-fallback",
});

let tcpServer = null;
let httpServer = null;

async function main() {
  try {
    const ok = await connectMongo();
    runtime.setMongoConnected(ok);
    if (ok) await locationStore.hydrateFromMongo();
    else log.warn("startup", "MongoDB unavailable — using in-memory store");
  } catch (err) {
    log.error("startup", "MongoDB failed", { error: err.message });
    if (config.mongoEnabled && config.isProduction) process.exit(1);
  }

  if (!config.simulationMode) {
    tcpServer = startTcpServer();
  } else {
    runtime.setTcpListening(true);
    log.info("TCP", "Skipped (SIMULATION_MODE)");
  }

  httpServer = createHttpServer();
  httpServer.listen(config.apiPort, config.apiHost, () => {
    runtime.setHttpListening(true);
    log.info("API", "Listening", {
      url: `http://${config.apiHost}:${config.apiPort}`,
      public: config.publicApiUrl,
    });
  });
}

function shutdown(signal) {
  log.info("shutdown", signal);
  tcpServer?.close();
  httpServer?.close(async () => {
    await disconnectMongo().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  log.error("process", "uncaughtException", { error: err.message });
  if (config.isProduction) process.exit(1);
});
process.on("unhandledRejection", (err) => {
  log.error("process", "unhandledRejection", { error: String(err) });
  if (config.isProduction) process.exit(1);
});

main().catch((err) => {
  log.error("startup", "Fatal", { error: err.message });
  process.exit(1);
});
