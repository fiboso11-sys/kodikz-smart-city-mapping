/**
 * Kodikz GPS backend — standalone Node.js process for Ubuntu VPS.
 *
 *   TCP  :5000  — Teltonika FMM130 devices (Codec 8)
 *   HTTP :3000  — REST API for Vercel-hosted Next.js frontend
 *
 *   SIMULATION_MODE=true — synthetic GPS into the same store (no TCP)
 *
 * Process manager: PM2 (see ecosystem.config.cjs)
 * Reverse proxy:   Nginx → http://127.0.0.1:3000 (see deploy/nginx/)
 *
 * This service does NOT run on Vercel.
 */

const config = require("./config");
const runtime = require("./runtime");
const { startTcpServer } = require("./tcp-server");
const { startApiServer } = require("./api");
const { startSimulation } = require("./simulation");
const { logStartupCompatibilityWarnings } = require("./lib/protocol-compat");

console.log("Kodikz GPS Backend");
console.log(`  NODE_ENV=${config.nodeEnv}`);
console.log(`  SIMULATION_MODE=${config.simulationMode}`);
console.log(`  TCP  ${config.host}:${config.tcpPort}`);
console.log(`  API  ${config.apiHost}:${config.apiPort}`);

/** @type {import('net').Server | null} */
let tcpServer = null;
/** @type {{ stop: () => void } | null} */
let simulation = null;

if (config.simulationMode) {
  console.log("[backend] Simulation active — Teltonika TCP listener disabled");
  simulation = startSimulation();
  runtime.setTcpListening(true);
} else {
  tcpServer = startTcpServer();
}

logStartupCompatibilityWarnings(config.simulationMode);

const httpServer = startApiServer();

function shutdown(signal) {
  console.log(`\n[backend] ${signal} — shutting down...`);
  simulation?.stop();
  tcpServer?.close();
  httpServer.close(() => {
    console.log("[backend] Stopped.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

function fatalError(kind, err) {
  console.error(`[backend] ${kind}:`, err);
  if (config.isProduction) {
    console.error("[backend] Exiting process (production fatal handler)");
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => fatalError("uncaughtException", err));
process.on("unhandledRejection", (err) => fatalError("unhandledRejection", err));
