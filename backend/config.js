/**
 * Central configuration from environment variables (VPS / PM2 / .env).
 * No Vercel or serverless assumptions — long-running Node process only.
 */

const path = require("path");
require("dotenv").config({ path: process.env.DOTENV_PATH || path.join(__dirname, ".env") });

let appVersion = process.env.APP_VERSION || "0.0.0";
try {
  appVersion = process.env.APP_VERSION || require("./package.json").version;
} catch {
  /* package.json optional in some test setups */
}

function envBool(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "true" || raw === "1" || raw.toLowerCase() === "yes";
}

const DEFAULT_SIMULATION_IMEIS = [
  "352093089674033",
  "352093089674034",
  "352093089674035",
  "352093089674036",
  "352093089674037",
];

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  serviceName: process.env.SERVICE_NAME || "kodikz-gps-backend",
  appVersion,
  simulationMode: envBool("SIMULATION_MODE"),
  simulationIntervalMs: Number(process.env.SIMULATION_INTERVAL_MS || 2000),
  simulationImeis: (process.env.SIMULATION_IMEIS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .length
    ? process.env.SIMULATION_IMEIS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_SIMULATION_IMEIS,
  /** Bind address for Teltonika TCP (must accept external devices). */
  host: process.env.HOST || "0.0.0.0",
  /** Bind address for Express (use 127.0.0.1 in production behind Nginx). */
  apiHost: process.env.API_HOST || "127.0.0.1",
  tcpPort: Number(process.env.TCP_PORT || 5000),
  apiPort: Number(process.env.API_PORT || 3000),
  tcpHandshakeTimeoutMs: Number(process.env.TCP_HANDSHAKE_TIMEOUT_MS || 30000),
  tcpMaxBufferBytes: Number(process.env.TCP_MAX_BUFFER_BYTES || 262144),
  /** Optional — when set, /vehicle and /vehicles require X-Api-Key header or api_key query. */
  apiKey: process.env.API_KEY?.trim() || "",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
  /** Comma-separated origins for browser (Vercel frontend). */
  corsOrigin: process.env.CORS_ORIGIN || "*",
  /** Trust X-Forwarded-* when behind Nginx */
  trustProxy: process.env.TRUST_PROXY !== "false",
};

function validateConfig() {
  if (!Number.isFinite(config.tcpPort) || config.tcpPort < 1 || config.tcpPort > 65535) {
    throw new Error(`Invalid TCP_PORT: ${process.env.TCP_PORT}`);
  }
  if (!Number.isFinite(config.apiPort) || config.apiPort < 1 || config.apiPort > 65535) {
    throw new Error(`Invalid API_PORT: ${process.env.API_PORT}`);
  }
  if (
    !Number.isFinite(config.simulationIntervalMs) ||
    config.simulationIntervalMs < 500
  ) {
    throw new Error(`Invalid SIMULATION_INTERVAL_MS: ${process.env.SIMULATION_INTERVAL_MS}`);
  }
  if (
    !Number.isFinite(config.tcpHandshakeTimeoutMs) ||
    config.tcpHandshakeTimeoutMs < 1000
  ) {
    throw new Error(`Invalid TCP_HANDSHAKE_TIMEOUT_MS: ${process.env.TCP_HANDSHAKE_TIMEOUT_MS}`);
  }
  if (!Number.isFinite(config.tcpMaxBufferBytes) || config.tcpMaxBufferBytes < 4096) {
    throw new Error(`Invalid TCP_MAX_BUFFER_BYTES: ${process.env.TCP_MAX_BUFFER_BYTES}`);
  }
  if (config.nodeEnv === "production" && (config.corsOrigin === "*" || config.corsOrigin.trim() === "")) {
    console.warn("[config] WARNING: CORS_ORIGIN is * or empty in production — set your Vercel URL(s).");
  }
  if (config.apiKey) {
    console.log("[config] API_KEY is set — /vehicle and /vehicles require authentication");
  }
}

validateConfig();

module.exports = config;
