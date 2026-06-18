const path = require("path");

require("dotenv").config({
  path: process.env.DOTENV_PATH || path.join(__dirname, "..", ".env"),
});

const { MONGO_URI } = require("./db");

let appVersion = "0.0.0";
try {
  appVersion = require("../package.json").version;
} catch {
  /* ignore */
}

function envBool(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "true" || raw === "1" || raw.toLowerCase() === "yes";
}

const domain = (process.env.DOMAIN || "api-kodikz.giantphoenixllc.com").trim();

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  serviceName: process.env.SERVICE_NAME || "kodikz-gps-backend",
  appVersion,
  domain,
  publicApiUrl:
    process.env.PUBLIC_API_URL || `https://${domain.replace(/^https?:\/\//, "")}`,
  mongoUri: MONGO_URI,
  mongoEnabled: Boolean(MONGO_URI),
  host: process.env.HOST || "0.0.0.0",
  apiHost: process.env.API_HOST || "0.0.0.0",
  tcpPort: Number(process.env.TCP_PORT || 5000),
  apiPort: Number(process.env.PORT || process.env.API_PORT || 3000),
  historyDefaultLimit: Number(process.env.HISTORY_DEFAULT_LIMIT || 50),
  historyMaxLimit: Number(process.env.HISTORY_MAX_LIMIT || 500),
  tcpHandshakeTimeoutMs: Number(process.env.TCP_HANDSHAKE_TIMEOUT_MS || 30000),
  tcpMaxBufferBytes: Number(process.env.TCP_MAX_BUFFER_BYTES || 262144),
  apiKey: process.env.API_KEY?.trim() || "",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  trustProxy: process.env.TRUST_PROXY !== "false",
  socketPath: process.env.SOCKET_PATH || "/socket.io",
  simulationMode: envBool("SIMULATION_MODE"),
};

if (!Number.isFinite(config.tcpPort) || !Number.isFinite(config.apiPort)) {
  throw new Error("Invalid PORT or TCP_PORT");
}

module.exports = config;
